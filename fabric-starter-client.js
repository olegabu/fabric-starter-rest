const fs = require('fs');
const axios = require('axios');
const _ = require('lodash');
const cfg = require('./config.js');
const logger = cfg.log4js.getLogger('FabricStarterClient');
const Client = require('fabric-client');
const unzip = require('unzip');
const path = require('path');
const urlParseLax = require('url-parse-lax');
const chmodPlus = require('chmod-plus');
const fabricCLI = require('./fabric-cli');

//const networkConfigFile = '../crypto-config/network.json'; // or .yaml
//const networkConfig = require('../crypto-config/network.json');

const invokeTimeout = process.env.INVOKE_TIMEOUT || 60000;
const asLocalhost = (process.env.DISCOVER_AS_LOCALHOST === 'true');

logger.debug(`invokeTimeout=${invokeTimeout} asLocalhost=${asLocalhost}`);

class FabricStarterClient {
    constructor(networkConfig) {
        this.networkConfig = networkConfig || require('./network')();
        logger.info('constructing with network config', JSON.stringify(this.networkConfig));
        this.client = Client.loadFromConfig(this.networkConfig); // or networkConfigFile
        this.peer = this.client.getPeersForOrg()[0];
        this.org = this.networkConfig.client.organization;
        this.affiliation = this.org;
        this.channelsInitializationMap = new Map();
    }

    async init() {
        await this.client.initCredentialStores();
        this.fabricCaClient = this.client.getCertificateAuthority();
    }

    async login(username, password) {
        this.user = await this.client.setUserContext({username: username, password: password});
    }

    async register(username, password, affiliation) {
        const registrar = this.fabricCaClient.getRegistrar()[0];
        const admin = await this.client.setUserContext({
            username: registrar.enrollId,
            password: registrar.enrollSecret
        });
        await this.fabricCaClient.register({
            enrollmentID: username,
            enrollmentSecret: password,
            affiliation: affiliation || this.affiliation,
            maxEnrollments: -1
        }, admin);
    }

    async loginOrRegister(username, password, affiliation) {
        try {
            await this.login(username, password);
        } catch (e) {
            await this.register(username, password, affiliation);
            await this.login(username, password);
        }
    }

    getSecret() {
        const signingIdentity = this.client._getSigningIdentity(true);
        const signedBytes = signingIdentity.sign(this.org);
        return String.fromCharCode.apply(null, signedBytes);
    }

    async queryChannels() {
        const channelQueryResponse = await this.client.queryChannels(this.peer, true);
        return channelQueryResponse.getChannels();
    }

    async queryPeers(orgName, peer) {
        orgName = orgName || this.org;
        peer = peer || this.peer;
        const peerQueryResponse = await this.client.queryPeers({target: peer, useAdmin: true});
        let peers = _.get(peerQueryResponse, `local_peers.${orgName}.peers`);
        return _.map(peers, p => this.createPeerFromUrl(p.endpoint));
    }

    async queryInstalledChaincodes() {
        const chaincodeQueryResponse = await this.client.queryInstalledChaincodes(this.peer, true);
        return chaincodeQueryResponse.getChaincodes();
    }

    async getConsortiumMemberList(systemChannelId) {
        if (cfg.isOrderer) {
            let channel = await this.getChannel(systemChannelId || cfg.systemChannelId);
            let sysChannelConfig = await channel.getChannelConfigFromOrderer();
            logger.debug(sysChannelConfig);
            let consortium = _.get(sysChannelConfig, "config.channel_group.groups.map.Consortiums");
            logger.debug("Consortium", consortium);
        } else {
            let result = await axios.get(`http://${cfg.ORDERER_API_ADDR}/consortium/members`, {params: {systemChannelId}});
            return result;
        }
    }

    async createChannel(channelId) {
        try {
            logger.info(channelId);
            const tx_id = this.client.newTransactionID(true);

            fabricCLI.downloadOrdererMSP();
            let orderer = this.createOrderer();

            let channelReq = {
                txId: tx_id,
                name: channelId,
                orderer: orderer
            };

            let channelTxContent = await fabricCLI.generateChannelConfigTxContent(channelId);
            let config_update = this.client.extractChannelConfig(channelTxContent);
            channelReq.config = config_update;
            channelReq.signatures = [this.client.signChannelConfig(config_update)];
            let res = await this.client.createChannel(channelReq);
            if (!res || res.status != "SUCCESS") {
                logger.error(res);
                return res;
            }
        } finally {
            this.chmodCryptoFolder();
        }
    }

    async joinChannel(channelId) {
        const tx2_id = this.client.newTransactionID(true);
        let peers = await this.queryPeers();
        let channel = await this.constructChannel(channelId, peers);
        let genesis_block = await channel.getGenesisBlock({txId: tx2_id});
        let gen_tx_id = this.client.newTransactionID(true);
        let j_request = {
            targets: peers,
            block: genesis_block,
            txId: gen_tx_id
        };
        let result = await channel.joinChannel(j_request);
        logger.debug(`Join channel ${channelId}:`, result);
        return result;
    }

    async addOrgToChannel(channelId, orgId) {
        let channelConfigFile = fabricCLI.fetchChannelConfig(channelId);
        let channelConfigBlock = await fabricCLI.translateChannelConfig(channelConfigFile);
        logger.debug(`Got channel config ${channelId}:`, channelConfigBlock);

        try {
            let channelConfigEnvelope = JSON.parse(channelConfigBlock.toString());
            let origChannelGroupConfig = _.get(channelConfigEnvelope, "data.data[0].payload.data.config");

            let newOrgConfigResp = await fabricCLI.prepareNewOrgConfig(orgId);

            let updatedConfig = _.merge({}, origChannelGroupConfig);
            if (_.get(updatedConfig, "channel_group.groups")) {
                _.merge(updatedConfig.channel_group.groups, newOrgConfigResp.outputJson);
            }

            logger.debug(`Channel updated config ${channelId}:`, _.toString(updatedConfig));
            let configUpdate = fabricCLI.computeChannelConfigUpdate(channelId, origChannelGroupConfig, updatedConfig);
            logger.debug(`Got updated envelope ${channelId}:`, _.toString(configUpdate));
            const txId = this.client.newTransactionID();

            try {
                let update = await this.client.updateChannel({
                    txId, name: channelId, config: configUpdate, orderer: this.createOrderer(),
                    signatures: [this.client.signChannelConfig(configUpdate)]
                });
                logger.info(`Update channel result ${channelId}:`, update);
                this.invalidateChannelsCache(channelId);
            } catch (e) {
                logger.error(e);
            }
        } catch (e) {
            logger.error(`Couldn't fetch/translate config for channel ${channelId}`, e);
        } finally {
            this.chmodCryptoFolder();
        }
    }

    async constructChannel(channelId, optionalPeer) {
        let channel = this.client.newChannel(channelId);
        channel.addOrderer(this.createOrderer());
        try {
            optionalPeer = optionalPeer || await this.queryPeers();

            if (_.isArray(optionalPeer)) {
                optionalPeer = _.find(optionalPeer, p => _.startsWith(p.getName(), "peer0")) || optionalPeer[0];
            }

            channel.addPeer(optionalPeer);
        } catch (e) {
            logger.warn(`Error adding peer ${optionalPeer} to channel ${channelId}`);
        }

        return channel;
    }

    async getChannel(channelId) {
        return await this.getChannelWithInitialization(channelId);
    }

    async getChannelWithInitialization(channelId) {
        let inProcessPromise = this.channelsInitializationMap.get(channelId);
        if (!inProcessPromise) {
            inProcessPromise = new Promise(async (resolve, reject) => {
                try {
                    logger.debug(`Initialise channel: ${channelId}`);
                    const channel = this.client.getChannel(channelId, false) || await this.constructChannel(channelId);
                    await channel.initialize({discover: true, asLocalhost: asLocalhost});
                    await channel.queryInfo(this.peer, true);
                    resolve(channel);
                } catch (e) {
                    logger.error(e);
                    reject(e);
                } finally {
                    this.channelsInitializationMap.set(channelId, null);
                }
            });
            this.channelsInitializationMap.set(channelId, inProcessPromise);
        }
        return inProcessPromise;
    }

    getChannelEventHub(channel) {
        //const channelEventHub = channel.getChannelEventHub(this.peer.getName());
        const channelEventHub = channel.newChannelEventHub(this.peer.getName());
        // const channelEventHub = channel.getChannelEventHubsForOrg()[0];
        channelEventHub.connect();
        return channelEventHub;
    }

    async installChaincode(channelId, chaincodeId, chaincodePath, version, language, targets, storage) {
        const channel = await this.getChannel(channelId);
        const peer = this.createTargetsList(channel, targets);
        const client = this.client;
        return new Promise((resolve, reject) => {
            fs.createReadStream(chaincodePath).pipe(unzip.Extract({path: storage}))
                .on('close', async function () {
                    fs.unlink(chaincodePath);
                    let chaincode_path = path.resolve(__dirname, `${storage}/${chaincodeId}`);
                    const proposal = {
                        targets: peer[0]._peer,
                        channelNames: channelId,
                        chaincodeId: chaincodeId,
                        chaincodePath: chaincode_path,
                        chaincodeVersion: version || '1.0',
                        chaincodeType: language || 'node',
                    };
                    const result = await client.installChaincode(proposal);
                    if (result[0].toString().startsWith('Error')) {
                        logger.error(result[0].toString());
                        reject(result[0].toString());
                    } else {
                        let msg = `Chaincode ${chaincodeId} successfully installed`;
                        logger.info(msg);
                        resolve(msg);
                    }
                });
        });
    }

    async instantiateChaincode(channelId, chaincodeId, type, fnc, args, version, targets, waitForTransactionEvent) {
        const channel = await this.getChannel(channelId);

        const tx_id = this.client.newTransactionID(true);
        const proposal = {
            chaincodeId: chaincodeId,
            chaincodeType: type || 'node',
            fcn: fnc || 'init',
            args: args || [],
            chaincodeVersion: version || '1.0',
            txId: tx_id
        };

        let badPeers;

        if (targets) {
            const targetsList = this.createTargetsList(channel, targets);
            const foundPeers = targetsList[0];
            badPeers = targetsList[1];

            proposal.targets = foundPeers;
        }
        let results = null;
        try {
            results = await channel.sendInstantiateProposal(proposal, invokeTimeout);
            logger.info('Sent instantiate proposal');
        } catch (error) {
            logger.error('In catch - sendInstantiateProposal', error.message);
        }
        const transactionRequest = {
            txId: tx_id,
            proposalResponses: results[0],
            proposal: results[1],
        };
        const promise = waitForTransactionEvent ? this.waitForTransactionEvent(tx_id, channel) : Promise.resolve(tx_id);
        const broadcastResponse = await channel.sendTransaction(transactionRequest);
        logger.trace('broadcastResponse', broadcastResponse);
        return promise.then(function (res) {
            res.badPeers = badPeers;
            return res;
        });
    }

    async retryInvoke(nTimes, resolve, reject, fn) {

        if (nTimes <= 0) return reject(`Invocation unsuccessful for ${cfg.INVOKE_RETRY_COUNT} retries.`);
        try {
            let response = await fn();
            resolve(response);
        } catch (err) {
            logger.trace(`Error: `, err, `\nRe-trying invocation: ${nTimes}.`);
            setTimeout(() => {this.retryInvoke(--nTimes, resolve, reject, fn)}, 3000);
        }
    }

    async invoke(channelId, chaincodeId, fcn, args, targets, waitForTransactionEvent) {
        const channel = this.client.getChannel(channelId, false);//await this.getChannel(channelId);
        let fsClient = this;

        const proposal = {
            chaincodeId: chaincodeId, fcn: fcn, args: args
        };

        let badPeers;

        if (targets) {
            const targetsList = this.createTargetsList(channel, targets);
            const foundPeers = targetsList[0];
            badPeers = targetsList[1];

            proposal.targets = foundPeers;
        }

        return new Promise((resolve, reject) => {

            fsClient.retryInvoke(cfg.INVOKE_RETRY_COUNT, resolve, reject, async function () {
                const txId = fsClient.client.newTransactionID(/*true*/);

                proposal.txId = txId;

                logger.trace('invoke proposal', proposal);

                const proposalResponse = await channel.sendTransactionProposal(proposal);

                // logger.trace('proposalResponse', proposalResponse);

                const transactionRequest = {
                    // tx_id: tx_id,
                    proposalResponses: proposalResponse[0],
                    proposal: proposalResponse[1],
                };

                const promise = waitForTransactionEvent ? fsClient.waitForTransactionEvent(txId, channel) : Promise.resolve(txId);

                const broadcastResponse = await channel.sendTransaction(transactionRequest);
                logger.trace('broadcastResponse', broadcastResponse);
                return promise.then(function (res) {
                    res.badPeers = badPeers;
                    return res;
                });
            });
        })
    }

    async waitForTransactionEvent(tx_id, channel) {
        const timeout = invokeTimeout;
        const id = tx_id.getTransactionID();
        let timeoutHandle;

        const timeoutPromise = new Promise((resolve, reject) => {
            timeoutHandle = setTimeout(() => {
                const msg = `timed out waiting for transaction ${id} after ${timeout}`;
                logger.error(msg);
                reject(new Error(msg));
            }, timeout);
        });

        const channelEventHub = this.getChannelEventHub(channel);

        const eventPromise = new Promise((resolve, reject) => {
            logger.trace(`registerTxEvent ${id}`);

            channelEventHub.registerTxEvent(id, (txid, status, blockNumber) => {
                logger.debug(`committed transaction ${txid} as ${status} in block ${blockNumber}`);
                resolve({txid: txid, status: status, blockNumber: blockNumber});
            }, (e) => {
                logger.error(`registerTxEvent ${e}`);
                reject(new Error(e));
            });
        });

        const racePromise = Promise.race([eventPromise, timeoutPromise]);

        racePromise.catch(() => {
            clearTimeout(timeoutHandle);
            channelEventHub.disconnect();
        }).then(() => {
            clearTimeout(timeoutHandle);
            channelEventHub.disconnect();
        });

        return racePromise;
    }

    async query(channelId, chaincodeId, fcn, args, targets) {
        const channel = await this.getChannel(channelId);

        const proposal = {
            chaincodeId: chaincodeId, fcn: fcn
        };

        logger.trace('query args', args);

        if (args) {
            proposal.args = JSON.parse(args);
        }
        else {
            proposal.args = [];
        }

        logger.trace('query targets', targets);

        if (targets) {
            const targetsList = this.createTargetsList(channel, JSON.parse(targets));
            const foundPeers = targetsList[0];
            const badPeers = targetsList[1];
            logger.trace('badPeers', badPeers);

            proposal.targets = foundPeers;
        }
        // else {
        //     proposal.targets = [this.peer];
        // }

        logger.trace('query proposal', proposal);

        const responses = await channel.queryByChaincode(proposal);

        return responses.map(r => {
            return r.toString('utf8');
        });
    }

    createTargetsList(channel, targets) {
        let peers = [];
        let badPeers = [];
        _.each(targets, function (value) {
            let peer = _.find(channel.getChannelPeers(), p => p._name === value);
            if (_.isNil(peer)) {
                logger.error(`Peer ${value} not found`);
                badPeers.push(value);
            } else {
                peers.push(peer);
            }
        });
        if (_.isEmpty(peers)) {
            logger.trace("Using default peer");
            peers.push(this.peer);
        } else
            logger.trace("Using specified peer(s)");
        return [peers, badPeers];
    }


    chmodCryptoFolder() {
        chmodPlus.directory(666, cfg.CRYPTO_CONFIG_DIR, {recursive: true});
        logger.debug(`Permissions for ${cfg.CRYPTO_CONFIG_DIR} folder are set to 666`);
    }

    invalidateChannelsCache(channelId) {
        this.client._channels = new Map(); //TODO: workaround until sdk supports cache invalidating
    }

    async getOrganizations(channelId) {
        const channel = await this.getChannel(channelId);
        return channel.getOrganizations();
    }

    async queryInstantiatedChaincodes(channelId) {
        const channel = await this.getChannel(channelId);
        return await channel.queryInstantiatedChaincodes();
    }

    async queryInfo(channelId) {
        const channel = await this.getChannel(channelId);
        return await channel.queryInfo(this.peer, true);
    }

    async queryBlock(channelId, number) {
        const channel = await this.getChannel(channelId);
        return await channel.queryBlock(number, this.peer, /*, true*/);
    }

    async queryTransaction(channelId, id) {
        const channel = await this.getChannel(channelId);
        return await channel.queryTransaction(id, this.peer, /*, true*/);
    }

    getPeersForOrg(mspid) {
        return this.client.getPeersForOrg(mspid);
    }

    getMspid() {
        return this.client.getMspid();
    }

    getNetworkConfig() {
        return this.networkConfig;
    }

    async getPeersForOrgOnChannel(channelId) {
        let peers = [];
        const channel = await this.getChannel(channelId);
        _.forEach(channel.getChannelPeers(), function (value) {
            peers.push(value._name)
        });
        return peers;
    }

    async registerBlockEvent(channelId, onEvent, onError) {
        const channel = await this.getChannel(channelId);
        const channelEventHub = this.getChannelEventHub(channel);
        return channelEventHub.registerBlockEvent(onEvent, onError);
    }

    async disconnectChannelEventHub(channelId) {
        const channel = await this.getChannel(channelId);
        const channelEventHub = this.getChannelEventHub(channel);
        return channelEventHub.disconnect();
    }

    createOrderer() {
        return this.client.newOrderer(`grpcs://${cfg.ORDERER_ADDR}`, {pem: this.loadPemFromFile(cfg.ORDERER_TLS_CERT)});
    }

    createPeerFromUrl(peerEndpoint) {
        let connectionOptions = this.defaultConnectionOptions(peerEndpoint);
        return this.client.newPeer(`grpcs://${peerEndpoint}`, connectionOptions);
    }

    loadPemFromFile(pemFilePath) {
        let certData = fs.readFileSync(pemFilePath);
        return Buffer.from(certData).toString()
    }

    defaultConnectionOptions(peerUrl, org, domain) {
        let parsedUrl = urlParseLax(peerUrl);
        let mspSubPath = parsedUrl.hostname;
        let connectionOptions = {
            'ssl-target-name-override': peerUrl,
            //'ssl-target-name-override': 'localhost',
            pem: this.loadPemFromFile(`${cfg.PEER_CRYPTO_DIR}/peers/${mspSubPath}/msp/tlscacerts/tlsca.${org || cfg.org}.${domain || cfg.domain}-cert.pem`)
        };
        return connectionOptions;
    }

}

module.exports = FabricStarterClient;
