const fs = require('fs');
const axios = require('axios');
const _ = require('lodash');
const cfg = require('./config.js');
const logger = cfg.log4js.getLogger('FabricStarterClient');
const Client = require('fabric-client');
const unzip = require('unzipper');
const path = require('path');
const urlParseLax = require('url-parse-lax');
const chmodPlus = require('chmod-plus');
const fabricCLI = require('./fabric-cli');
const x509 = require('x509');
const util = require('./util');
const certsManager = require('./certs-manager');
const channelManager = require('./channel-manager');
//const networkConfigFile = '../crypto-config/network.json'; // or .yaml
//const networkConfig = require('../crypto-config/network.json');

const asLocalhost = (process.env.DISCOVER_AS_LOCALHOST === 'true');
const IS_ADMIN = true;

logger.debug(`invokeTimeout=${cfg.CHAINCODE_PROCESSING_TIMEOUT} asLocalhost=${asLocalhost}`);

class FabricStarterClient {
    constructor(networkConfig) {
        FabricStarterClient.setConfigObject(cfg.CRYPTO_SUIT_CONFIG);

        this.networkConfig = networkConfig || require('./network')();
        logger.info('constructing with network config:', JSON.stringify(this.networkConfig));
        this.client = Client.loadFromConfig(this.networkConfig); // or networkConfigFile
        this.ordererClient = Client.loadFromConfig(this.networkConfig); // or networkConfigFile
        this.peer = this.client.getPeersForOrg()[0];
        this.org = this.networkConfig.client.organization;
        this.affiliation = this.org;
        this.channelsInitializationMap = new Map();
        this.registerQueue = new Map();
    }

    static setConfigObject(config) {
        _.forEach(config, (value, key)=>{
            Client.setConfigSetting(key, value);
        } )
    }

    async init() {
        await this.client.initCredentialStores();
        this.fabricCaClient = cfg.AUTH_MODE === 'CA' ? this.client.getCertificateAuthority() : undefined;
        await this.ordererClient.initCredentialStores();
        try {
            this.ordererClient.setAdminSigningIdentity(
                util.loadPemFromFile(certsManager.getPrivateKeyFilePath()),
                util.loadPemFromFile(certsManager.getSignCertPath()),
                cfg.ORDERER_MSPID
            );
        } catch (err) {
            logger.debug("Not orderer host")
        }
    }

    async login(username, password) {
        if (cfg.AUTH_MODE === 'CA') {
            this.user = await this.client.setUserContext({username: username, password: password}, true);
        } else if (cfg.AUTH_MODE === 'ADMIN') {
            if (cfg.enrollId != username || cfg.enrollSecret != password) {
                throw Error("Invalid credentials");
            }
            this.user = await this.createUserWithAdminRights(username, password);
        } else {
            throw Error("AUTH_MODE is not defined.");
        }
    }

    async createUserWithAdminRights(username) {
        let mspId = this.org;
        return await this.client.createUser({
            username: username,
            mspid: mspId,
            cryptoContent: {
                privateKey: certsManager.getPrivateKeyFilePath(mspId),
                signedCert: certsManager.getSignCertPath(mspId)
            },
            skipPersistence: true
        });
    }

    logoutUser(userName) {
        const userCachePath = _.get(this, "networkConfig.client.credentialStore.path");
        if (userCachePath) {
            const userFile = path.join(userCachePath, userName);
            try {
                fs.unlinkSync(userFile);
            } catch (err) {
                logger.debug(`Cannot remove credential store: ${userFile}`, err.Error || err);
            }
        }
    }

    async register(username, password, affiliation) {
        if (cfg.AUTH_MODE === 'CA') {
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
    }

    async loginOrRegister(username, password, affiliation) {
        if (this.registerQueue[username]) {
            return this.registerQueue[username];
        }
        this.registerQueue[username] = new Promise((resolve, reject) => {
            return this.login(username, password).then(resolve)
                .catch((err) => {
                    logger.error("Login error:", err);
                    return this.register(username, password, affiliation)
                        .then(() => this.login(username, password));
                })
                .then(() => this.registerQueue[username] = null)
                .then(resolve)
                .catch(err => {
                    reject(err);
                });
        });
        return this.registerQueue[username];
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

    async createChannel(channelId) {
        try {
            logger.info(`Creating channel ${channelId}`);
            await fabricCLI.downloadOrdererMSP();

            const tx_id = this.client.newTransactionID(true);
            let orderer = this.client.getOrderer(cfg.ORDERER_ADDR); //this.createOrderer();

            let channelReq = {
                txId: tx_id,
                name: channelId,
                orderer: orderer
            };

            let channelTxContent = await fabricCLI.generateChannelConfigTxContent(channelId);
            let config_update = this.client.extractChannelConfig(channelTxContent);
            channelReq.config = config_update;
            channelReq.signatures = [await this.client.signChannelConfig(config_update)];
            // let res = await this.client.createChannel(channelReq);
            fabricCLI.createChannelByCli(channelId);
            // if (!res || res.status != "SUCCESS") {
                // logger.error(res);
                // throw new Error(res.info);
            // }
        } finally {
            this.chmodCryptoFolder();
        }
    }

    async joinChannel(channelId) {
        logger.info(`Joining channel ${channelId}`);
        await fabricCLI.downloadOrdererMSP();

        const tx2_id = this.client.newTransactionID(true);
        let peers = await this.queryPeers();
        let channel = await this.constructChannel(channelId, peers);
        let genesis_block = await channel.getGenesisBlock();//{txId: tx2_id});
        let gen_tx_id = this.client.newTransactionID(true);
        let j_request = {
            targets: peers,
            block: genesis_block,
            txId: gen_tx_id
        };
        logger.debug(`Joining channel request [${channelId}]:`, j_request);
        let result = await channel.joinChannel(j_request);
        logger.debug(`Joined channel ${channelId}:`, result);
        return result;
    }

    async addOrgToChannel(channelId, orgObj) {
        await this.checkOrgDns(orgObj);
        try {
            await util.checkRemotePort(`peer0.${orgObj.orgId}.${orgObj.domain || cfg.domain}`, orgObj.peer0Port);
            let currentChannelConfigFile = fabricCLI.fetchChannelConfig(channelId);
            let configUpdateRes = await fabricCLI.prepareNewOrgConfig(orgObj);
            let res = await channelManager.applyConfigToChannel(channelId, currentChannelConfigFile, configUpdateRes, this.client);
            this.chmodCryptoFolder();
            return res;
        } catch (e) {
            return e;
        } finally {
            this.invalidateChannelsCache(channelId);
        }
    }

    async addOrgToConsortium(orgObj, consortiumName) {
        await this.checkOrgDns(orgObj);
        let currentChannelConfigFile = fabricCLI.fetchChannelConfig(cfg.systemChannelId, certsManager.getOrdererMSPEnv());
        let configUpdateRes = await fabricCLI.prepareNewConsortiumConfig(orgObj, consortiumName);
        return channelManager.applyConfigToChannel(cfg.systemChannelId, currentChannelConfigFile, configUpdateRes, this.ordererClient, IS_ADMIN);
    }

    async getConsortiumMemberList(consortiumName = 'SampleConsortium') {
        let result = [];
        try {
            // let channel = await (this.client.getChannel(cfg.systemChannelId, false) || this.constructChannel(cfg.systemChannelId));
            // let sysChannelConfig = await channel.getChannelConfigFromOrderer();
            let channelConfigBlock = fabricCLI.fetchChannelConfig(cfg.systemChannelId, certsManager.getOrdererMSPEnv());
            let channelGroupConfig = await fabricCLI.translateChannelConfig(channelConfigBlock);
            logger.debug(channelGroupConfig);
            // let consortium = _.get(sysChannelConfig, "config.channel_group.groups.map.Consortiums");
            // let participants = _.get(consortium, 'value.groups.map.SampleConsortium.value.groups.map');
            let consortium = _.get(channelGroupConfig, `channel_group.groups.Consortiums.groups.${consortiumName}`);
            let participants = _.get(consortium, 'groups');
            // return util.filterOrderersOut(participants);
            result = _.filter(_.keys(participants), name => {
                return !(_.startsWith(name, "Orderer") || _.startsWith(name, "orderer"));
            });
        } catch (err) {
            logger.debug("Not enough permissions to access Consortium");
        }
        return result;
    }

    async checkOrgDns(orgObj) {
        let chaincodeList = await this.queryInstantiatedChaincodes(cfg.DNS_CHANNEL);
        if (!chaincodeList || !chaincodeList.chaincodes.find(i => i.name === "dns"))
            return;
        const dns = await this.query(cfg.DNS_CHANNEL, cfg.DNS_CHAINCODE, "get", '["dns"]', {targets: []});
        try {
            // let dnsRecordsList = dns && dns.length && JSON.parse(dns[0]);

            const orgId = _.get(orgObj, "orgId");
            const orgIp = _.get(orgObj, "orgIp");

            if (orgIp){
                await this.invoke(cfg.DNS_CHANNEL, cfg.DNS_CHAINCODE, "registerOrg", [JSON.stringify(orgObj)], {targets: []}, true)
                    .then(() => util.sleep(cfg.DNS_UPDATE_TIMEOUT));
            }
        } catch (e) {
            logger.warn("Unparseable", dns);
        }
    }
    async constructChannel(channelId, optionalPeer) {
        let channel = this.client.getChannel(channelId, false);
        if (!channel) {
            channel = this.client.newChannel(channelId);
            channel.addOrderer(this.client.getOrderer(cfg.ORDERER_ADDR)); //this.createOrderer());
            try {
                optionalPeer = optionalPeer || await this.queryPeers();

                if (_.isArray(optionalPeer)) {
                    optionalPeer = _.find(optionalPeer, p => _.startsWith(p.getName(), "peer0")) || optionalPeer[0];
                }

                channel.addPeer(optionalPeer);
            } catch (e) {
                logger.warn(`Error adding peer ${optionalPeer} to channel ${channelId}`);
            }
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
                    await channel.initialize({
                        discover: cfg.USE_SERVICE_DISCOVERY,
                        asLocalhost: asLocalhost,
                        target: this.peer
                    }); //TODO: is target needed
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

    getChannelEventHub(channel, options) {
        //const channelEventHub = channel.getChannelEventHub(this.peer.getName());
        const channelEventHub = channel.newChannelEventHub(this.peer.getName());
        // const channelEventHub = channel.getChannelEventHubsForOrg()[0];
        channelEventHub.connect(options);
        return channelEventHub;
    }

    async installChaincode(chaincodeId, chaincodePath, version, language, storage) {
        const peer = this.peer;
        const client = this.client;
        let fsClient = this;
        return new Promise((resolve, reject) => {
            fs.createReadStream(chaincodePath).pipe(unzip.Extract({path: language === 'golang' ? '/opt/gopath/src' : storage}))
                .on('close', async function () {
                    try {
                        fs.unlinkSync(chaincodePath);
                    } catch (e) {
                        logger.warn("Deleting temp file failed: ", e)
                    }
                    let fullChaincodePath = path.resolve(__dirname, `${storage}/${chaincodeId}`);
                    const proposal = {
                        targets: peer,
                        chaincodeId: chaincodeId,
                        chaincodePath: language === 'golang' ? chaincodeId : fullChaincodePath,
                        chaincodeVersion: version || '1.0',
                        chaincodeType: language || 'node',
                    };
                    try {
                        const result = await client.installChaincode(proposal);
                        fsClient.errorCheck(result);
                        let msg = `Chaincode ${chaincodeId}:${version} successfully installed`;
                        logger.info(msg);
                        resolve(msg);
                    } catch (e) {
                        return reject(e);
                    }
                });
        });
    }

    async instantiateChaincode(channelId, chaincodeId, type, fcn, args, version, targets, waitForTransactionEvent, policy, collections) {
        const channel = await this.getChannel(channelId);

        const tx_id = this.client.newTransactionID(true);
        let collectionsConfigPath;
        if (collections)
            collectionsConfigPath = path.resolve(__dirname, collections);
        let endorsmentPolicy;
        if (policy)
            endorsmentPolicy = JSON.parse(policy);
        const proposal = {
            chaincodeId: chaincodeId,
            chaincodeType: type || 'node',
            fcn: fcn || 'init',
            args: args || [],
            chaincodeVersion: version || '1.0',
            txId: tx_id,
            'endorsement-policy': endorsmentPolicy,
            'collections-config': collectionsConfigPath
        };
        let badPeers;

        if (targets) {
            const targetsList = this.createTargetsList(channel, targets);
            const foundPeers = targetsList.peers;
            badPeers = targetsList.badPeers;
            logger.trace('badPeers', badPeers);

            proposal.targets = foundPeers;
        }
        logger.info('Sent instantiate proposal');
        logger.trace(proposal);
        const results = await channel.sendInstantiateProposal(proposal, cfg.CHAINCODE_PROCESSING_TIMEOUT);
        this.errorCheck(results);
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

    async upgradeChaincode(channelId, chaincodeId, type, fcn, args, version, targets, waitForTransactionEvent, policy, collections) {
        const channel = await this.getChannel(channelId);

        const tx_id = this.client.newTransactionID(true);
        let collectionsConfigPath;
        if (collections)
            collectionsConfigPath = path.resolve(__dirname, collections);
        let endorsmentPolicy;
        if (policy)
            endorsmentPolicy = JSON.parse(policy);
        const proposal = {
            chaincodeId: chaincodeId,
            chaincodeType: type || 'node',
            fcn: fcn || 'init',
            args: args || [],
            chaincodeVersion: version || '1.0',
            txId: tx_id,
            'endorsement-policy': endorsmentPolicy,
            'collections-config': collectionsConfigPath
        };
        let badPeers;

        if (targets) {
            const targetsList = this.createTargetsList(channel, targets);
            const foundPeers = targetsList.peers;
            badPeers = targetsList.badPeers;
            logger.trace('badPeers', badPeers);

            proposal.targets = foundPeers;
        }
        logger.info('Sent upgrade proposal');
        logger.trace(proposal);
        const results = await channel.sendUpgradeProposal(proposal, cfg.CHAINCODE_PROCESSING_TIMEOUT);
        this.errorCheck(results);
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

    async invoke(channelId, chaincodeId, fcn, args, targets, waitForTransactionEvent, transientMap) {
        const channel = await this.getChannel(channelId);
        let fsClient = this;

        const proposal = {
            chaincodeId: chaincodeId,
            fcn: fcn,
            args: args
        };

        if (transientMap) {
            proposal.transientMap =
                Object.assign(...
                    Object.keys(transientMap).map((key) => {
                        return {[key]: Buffer.from(JSON.stringify(transientMap[key]))}
                    }))
        }

        let badPeers;

        if (targets && (targets.targets || targets.peers)) {
            const targetsList = this.createTargetsList(channel, targets);
            const foundPeers = targetsList.peers;
            badPeers = targetsList.badPeers;
            logger.trace('badPeers', badPeers);

            proposal.targets = foundPeers;
        } else {
            proposal.targets = [this.peer];
        }
        logger.debug("Proposal", proposal);

        return util.retryOperation(cfg.INVOKE_RETRY_COUNT, async function () {
            const txId = fsClient.client.newTransactionID(/*true*/);

            proposal.txId = txId;

            logger.trace('invoke proposal', proposal);
            let proposalResponse;
            try {
                proposalResponse = await channel.sendTransactionProposal(proposal);
                fsClient.errorCheck(proposalResponse);

            } catch (e) {
                throw new Error(e);
            }

            const transactionRequest = {
                // tx_id: tx_id,
                proposalResponses: proposalResponse[0],
                proposal: proposalResponse[1],
            };

            const promise = waitForTransactionEvent ? fsClient.waitForTransactionEvent(txId, channel) : Promise.resolve({txId: txId});

            const broadcastResponse = await channel.sendTransaction(transactionRequest);
            logger.trace('broadcastResponse', broadcastResponse);
            return promise.then(function (res) {
                res.PeersNotFound = badPeers;
                res.chaincodeResult = _.get(proposalResponse, "[0].response.payload");
                return res;
            });
        });
    }

    errorCheck(results) {
        logger.trace('proposalResponse', results);
        results.map(r => {
            const checkError = _.toString(r);
            if (_.startsWith(checkError, 'Error')) {
                throw ({message: checkError, status: _.get(r, '[0].status') || _.get(r, 'status')});
            }
        });
    }

    async waitForTransactionEvent(tx_id, channel) {
        const timeout = cfg.CHAINCODE_PROCESSING_TIMEOUT;
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
        } else {
            proposal.args = [];
        }

        logger.trace('query targets', targets);

        if (targets && (targets.targets || targets.peers)) {
            const targetsList = this.createTargetsList(channel, targets);
            const foundPeers = targetsList.peers;
            const badPeers = targetsList.badPeers;
            logger.trace('badPeers', badPeers);

            proposal.targets = foundPeers;
        }
        // else {
        //     proposal.targets = [this.peer]; //TODO: define option for single target
        // }

        logger.trace('query proposal', proposal);

        const responses = await channel.queryByChaincode(proposal);
        this.errorCheck(responses);
        return responses.map(r => {
            return r.toString('utf8');
        });
    }

    createTargetsList(channel, targets) {
        let peers = [];
        let badPeers = [];
        _.each(_.compact(_.concat([], targets.targets, targets.peers)), function (value) {
            let peer = _.find(channel.getChannelPeers(), p => p._name === value);
            if (peer) {
                peers.push(peer);
            } else {
                logger.error(`Peer ${value} not found`);
                badPeers.push(value);
            }
        });

        if (_.isEmpty(peers)) {
            logger.trace("Using default peer");
            peers.push(this.peer);
        } else
            logger.trace("Using specified peer(s)");
        return {
            peers,
            badPeers
        };
    }


    chmodCryptoFolder() {
        //chmodPlus.directory(666, cfg.CRYPTO_CONFIG_DIR, {recursive: true});
        // logger.debug(`Permissions for ${cfg.CRYPTO_CONFIG_DIR} folder are set to 666`);
    }

    invalidateChannelsCache(channelId) {
        this.client._channels = new Map(); //TODO: workaround until sdk supports cache invalidating
    }

    async getOrganizations(channelId, filter) {
        const channel = await this.getChannel(channelId);
        const organizations = channel.getOrganizations();
        return filter ? util.filterOrderersOut(organizations) : organizations;
    }

    async queryInstantiatedChaincodes(channelId) {
        try {
            const channel = await this.getChannel(channelId);
            return await channel.queryInstantiatedChaincodes();
        } catch (e) {
            return null;
        }
    }

    async queryInfo(channelId) {
        const channel = await this.getChannel(channelId);
        return await channel.queryInfo(this.peer, true);
    }

    async queryBlock(channelId, number, admin = false) {
        const channel = await this.getChannel(channelId);
        return await channel.queryBlock(number, this.peer, admin);
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

    async registerBlockEvent(channelId, onEvent, onError, eventHubConnectOptions) {
        const channel = await this.getChannel(channelId);
        const channelEventHub = this.getChannelEventHub(channel, eventHubConnectOptions);
        return channelEventHub.registerBlockEvent(onEvent, onError);
    }

    async disconnectChannelEventHub(channelId) {
        const channel = await this.getChannel(channelId);
        const channelEventHub = this.getChannelEventHub(channel);
        return channelEventHub.disconnect();
    }

    createPeerFromUrl(peerEndpoint) {
        let connectionOptions = this.defaultConnectionOptions(peerEndpoint);
        return this.client.newPeer(`grpcs://${peerEndpoint}`, connectionOptions);
    }

    defaultConnectionOptions(peerUrl, org, domain) {
        let parsedUrl = urlParseLax(peerUrl);
        let mspSubPath = parsedUrl.hostname;
        let connectionOptions = {
            'ssl-target-name-override': peerUrl,
            //'ssl-target-name-override': 'localhost',
            pem: util.loadPemFromFile(`${cfg.PEER_CRYPTO_DIR}/peers/${mspSubPath}/msp/tlscacerts/tlsca.${org || cfg.org}.${domain || cfg.domain}-cert.pem`)
        };
        return connectionOptions;
    }

    decodeCert(cert) {
        return x509.parseCert(cert);
    }
}

module.exports = FabricStarterClient;
