const fs = require('fs');
const _ = require('lodash');
const cfg = require('./config.js');
const logger = cfg.log4js.getLogger('FabricStarterClient');
const Client = require('fabric-client');
const unzip = require('unzipper');
const path = require('path');
const urlParseLax = require('url-parse-lax');
const chmodPlus = require('chmod-plus');
const fabricCLI = require('./fabric-cli');
const util = require('./util');
const localDns = require('./util/local-dns');
const certsManager = require('./certs-manager');
const channelManager = require('./channel-manager');
//const networkConfigFile = '../crypto-config/network.json'; // or .yaml
//const networkConfig = require('../crypto-config/network.json');
const networkConfigProvider = require('./network');

const asLocalhost = (process.env.DISCOVER_AS_LOCALHOST === 'true');
const IS_ADMIN = true;

logger.debug(`invokeTimeout=${cfg.CHAINCODE_PROCESSING_TIMEOUT} asLocalhost=${asLocalhost}`);

class FabricStarterClient {
    constructor(networkConfig, txEventQueue) {
        FabricStarterClient.setDefaultConfigSettings(cfg.CRYPTO_SUIT_CONFIG);

        this.networkConfig = networkConfig || networkConfigProvider(cfg.cas);
        logger.info('constructing with network config:', JSON.stringify(this.networkConfig));
        this.client = Client.loadFromConfig(this.networkConfig); // or networkConfigFile

        this.peer = this.client.getPeersForOrg()[0];
        // this.org = this.networkConfig.client.organization; //todo:?
        this.channelsInitializationMap = new Map();
        this.registerQueue = new Map();
        this.clients = new Map()
        this.txEventQueue = txEventQueue
    }

    static setDefaultConfigSettings(config) {
        _.forEach(config, (value, key) => {
            Client.setConfigSetting(key, value);
        })
    }

    async init() { //todo: remove after removing from dns.js
        //     // await this.client.initCredentialStores();
        //     await this.ordererClient.initCredentialStores();
        //     this.fabricCaClient = cfg.AUTH_MODE === 'CA' ? this.ordererClient.getCertificateAuthority() : undefined;
        //     try {
        //         this.ordererClient.setAdminSigningIdentity(
        //             util.loadPemFromFile(certsManager.getPrivateKeyFilePath()),
        //             util.loadPemFromFile(certsManager.getSignCertPath()),
        //             cfg.ORDERER_MSPID
        //         );
        //     } catch (err) {
        //         logger.debug("Not orderer host")
        //     }
    }

    async login(username, password) {
        if (cfg.AUTH_MODE === 'CA') {
            await this.checkClientInitialized();
            this.clearUsersPreviousLoginCache(username);
            this.user = await this.client.setUserContext({username: username, password: password}, true);
        } else if (cfg.AUTH_MODE === 'ADMIN') {
            if (cfg.ENROLL_ID !== username || cfg.enrollSecret !== password) {
                throw Error("Invalid credentials");
            }
            this.user = await this.createUserWithAdminRights(username, password);
        } else {
            throw Error("AUTH_MODE is not defined.");
        }
    }

    clearUsersPreviousLoginCache(username) {
        this.client.getStateStore() && this.client.getStateStore().setValue(username, '')
    }

    async checkClientInitialized() {
        if (!this.client.getStateStore()) {
            await this.client.initCredentialStores();
        }
    }

    async createUserWithAdminRights(username) {
        let mspId = cfg.org;// this.org;
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

    async register(username, password, affiliation, role, attrs = []) {
        if (cfg.AUTH_MODE === 'CA') {
            await this.checkClientInitialized();
            let fabricCaClient = this.client.getCertificateAuthority()
            const registrar = fabricCaClient.getRegistrar()[0];
            const admin = await this.client.setUserContext({
                username: registrar.enrollId, //TODO: used to be enrollId, now unexpectedly ENROLL_ID
                password: registrar.enrollSecret
            });
            return await fabricCaClient.register({
                enrollmentID: username,
                enrollmentSecret: password,
                affiliation: affiliation || cfg.org,
                maxEnrollments: -1,
                role,
                attrs
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

    async enroll(enrollmentId, password, profile) {
        let fabricCaClient = this.client.getCertificateAuthority()
        return await fabricCaClient.enroll({enrollmentID: enrollmentId, enrollmentSecret: password, profile})
    }

    getSecret() {
        const signingIdentity = this.client._getSigningIdentity(true);
        const signedBytes = signingIdentity.sign(cfg.org);
        return String.fromCharCode.apply(null, signedBytes);
    }

    async queryChannels() {
        const channelQueryResponse = await this.client.queryChannels(this.peer, true);
        return channelQueryResponse.getChannels();
    }

    async queryPeers(orgName, peer) {
        orgName = orgName || cfg.org;
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
            // await fabricCLI.downloadOrdererMSP();

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
        // await fabricCLI.downloadOrdererMSP();

        const tx2_id = this.client.newTransactionID(true);
        let peers = [this.peer];//await this.queryPeers();
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

    async addOrgToChannel(channelId, orgObj, certFiles) {
        await this.checkOrgDns(orgObj);
        try {
            await util.checkRemotePort(cfg.addressFromTemplate(orgObj.peerName || 'peer0', orgObj.orgId, orgObj.domain), orgObj.peer0Port,
                {from: `addOrgToChannel(${channelId}, ${orgObj})`}); //TODO: , throws: true
            let currentChannelConfigFile = await fabricCLI.fetchChannelConfig(channelId);
            let configUpdateRes = await fabricCLI.prepareOrgConfigStruct(orgObj, 'NewOrg.json', {NEWORG_PEER0_PORT: orgObj.peer0Port || cfg.DEFAULT_PEER0PORT}, certFiles);
            let res = await channelManager.applyConfigToChannel(channelId, currentChannelConfigFile, configUpdateRes, this.client);
            this.chmodCryptoFolder();
            return res;
        } catch (e) {
            logger.error(e)
            throw e;
        } finally {
            this.invalidateChannelsCache(channelId);
        }
    }

    async addOrgToConsortium(orgObj, consortiumName, certFiles) {
        await this.checkOrgDns(orgObj);
        let currentChannelConfigFile = await fabricCLI.fetchChannelConfig(cfg.systemChannelId, certsManager.getOrdererMSPEnv());
        let configUpdateRes = await fabricCLI.prepareOrgConfigStruct(orgObj, 'Consortium.json', {CONSORTIUM_NAME: consortiumName || cfg.DEFAULT_CONSORTIUM}, certFiles);
        try {
            let ordererClient = await this.initOrdererClient();
            return channelManager.applyConfigToChannel(cfg.systemChannelId, currentChannelConfigFile, configUpdateRes, ordererClient, IS_ADMIN);
        } catch (err) {
            throw new Error("There is no Orderer on this node. Consortium cannot be updated.")
        }

    }

    async initOrdererClient() {
        try {
            const ordererClient = Client.loadFromConfig(networkConfigProvider(cfg.cas)); //this.networkConfig);
            await ordererClient.initCredentialStores();
            ordererClient.setAdminSigningIdentity(
                util.loadPemFromFile(certsManager.getPrivateKeyFilePath()),
                util.loadPemFromFile(certsManager.getSignCertPath()),
                cfg.ordererMspId
            );
            return ordererClient
        } catch (err) {
            logger.info("No orderer on host", err)
        }
    }

    async getConsortiumMemberList(consortiumName = 'SampleConsortium') {
        logger.debug("About to get consortium members list")
        let result = [];
        return new Promise(async (resolve, reject) => {
            try {
                // let channel = await (this.client.getChannel(cfg.systemChannelId, false) || this.constructChannel(cfg.systemChannelId));
                // let sysChannelConfig = await channel.getChannelConfigFromOrderer();
                let channelConfigBlock = await fabricCLI.fetchChannelConfig(cfg.systemChannelId, certsManager.getOrdererMSPEnv());
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
                return resolve(result);
            } catch (err) {
                logger.debug("Not enough permissions to access Consortium", err);
                reject(err)
            }

        })
    }

    async checkOrgDns(orgObj) {
        let chaincodeList = await this.queryInstantiatedChaincodes(cfg.DNS_CHANNEL);
        // if (!chaincodeList || !chaincodeList.chaincodes.find(i => i.name === "dns"))
        //     return;
        const dns = await this.query(cfg.DNS_CHANNEL, cfg.DNS_CHAINCODE, "get", '["dns"]', {targets: []});
        try {
            // let dnsRecordsList = dns && dns.length && JSON.parse(dns[0]);

            const orgId = _.get(orgObj, "orgId");
            const orgIp = _.get(orgObj, "orgIp");

            if (orgIp) {
                await this.invoke(cfg.DNS_CHANNEL, cfg.DNS_CHAINCODE, "registerOrg", [JSON.stringify(orgObj)], {targets: []}, true)
                    .then(() => util.sleep(cfg.DNS_UPDATE_TIMEOUT));
                await localDns.updateLocalDnsStorageFromChaincode(this)
            }
        } catch (e) {
            logger.warn("Error on dns info:", dns, e);
        }
    }

    async constructChannel(channelId, optionalPeer) {
        let channel = this.client.getChannel(channelId, false);
        if (!channel) {
            channel = this.client.newChannel(channelId);
            channel.addOrderer(this.client.getOrderer(cfg.ORDERER_ADDR)); //this.createOrderer());
            try {
                if (optionalPeer) { //TODO: seems unnecessary code
                    optionalPeer = optionalPeer || await this.queryPeers();

                    if (_.isArray(optionalPeer)) {
                        optionalPeer = _.find(optionalPeer, p => _.startsWith(p.getName(), "peer0")) || optionalPeer[0];
                    }

                    channel.addPeer(optionalPeer);
                }
            } catch (e) {
                logger.warn(`Error adding peer ${optionalPeer} to channel ${channelId}`, e);
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
        channelEventHub.connect(options, (err, data)=>{
            err && logger.error(`Error at connection to ChannelEventHub: ${channel}`, err)
        });
        return channelEventHub;
    }

    async installChaincodeOld(chaincodeId, chaincodePath, version, language, baseDir) {
        const peer = this.peer;
        const client = this.client;
        let fsClient = this;
        return new Promise((resolve, reject) => {
            fs.createReadStream(chaincodePath).pipe(unzip.Extract({path: language === 'golang' ? '/opt/gopath/src' : baseDir}))
                .on('close', async function () {
                    try {
                        fs.unlinkSync(chaincodePath);
                    } catch (e) {
                        logger.warn("Deleting temp file failed: ", e)
                    }

                    let fullChaincodePath = path.resolve(__dirname, baseDir, chaincodeId);
                    /*
                                        const chaincodePackageFile = fabricCLI.packageChaincodeWithInstantiationPolicy(chaincodeId, fullChaincodePath, version, language)
                                        const proposal = {
                                            targets: peer,
                                            chaincodePackage: fs.readFileSync(chaincodePackageFile)
                                        }
                    */
                    let proposal = {
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


    async installChaincode(chaincodeId, chaincodePath, version, language) {
        let that = this;
        return new Promise(async (resolve, reject) => {

            // let chaincodePath = language === 'golang' ? chaincodeId : path.resolve(/*__dirname,*/ chaincodePath, chaincodeId);
            /*
                                const chaincodePackageFile = fabricCLI.packageChaincodeWithInstantiationPolicy(chaincodeId, fullChaincodePath, version, language)
                                const proposal = {
                                    targets: peer,
                                    chaincodePackage: fs.readFileSync(chaincodePackageFile)
                                }
            */
            let proposal = {
                targets: that.peer,
                chaincodeId: chaincodeId,
                chaincodePath: /*language === 'golang' ? chaincodeId :*/ chaincodePath,
                chaincodeVersion: version || '1.0',
                chaincodeType: language || 'node',
            };

            try {
                const result = await that.client.installChaincode(proposal);
                that.errorCheck(result);
                let msg = `Chaincode ${chaincodeId}:${version} successfully installed`;
                logger.info(msg);
                resolve(msg);
            } catch (e) {
                return reject(e);
            }
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
        const logArgs = _.map(proposal.args, a => _.toString(a).substring(0, 250) + (_.size(a) > 250 ? ' ...' : ''))
        logger.debug("Proposal", ({...proposal, args: logArgs}))

        return await util.retryOperation(cfg.INVOKE_RETRY_COUNT, cfg.CHANNEL_LISTENER_UPDATE_TIMEOUT, async function () {
            const txId = fsClient.client.newTransactionID(/*true*/);

            proposal.txId = txId;

            // logger.trace('invoke proposal', proposal.chaincodeId, proposal.fcn, proposal.args,);
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
                // resolve({txid:id, msg: msg});
            }, timeout);
        });

        let channelEventHub;

        const eventPromise = new Promise((resolve, reject) => {
            logger.trace(`registerTxEvent ${id}`);
            if (!cfg.DISABLE_TX_ID_LISTENER) { //TODO: refactor
                channelEventHub = this.getChannelEventHub(channel);
                channelEventHub.registerTxEvent(id, (txid, status, blockNumber) => {
                    logger.debug(`committed transaction ${txid} as ${status} in block ${blockNumber}`);
                    resolve({txid: txid, status: status, blockNumber: blockNumber});
                }, (e) => {
                    logger.error(`registerTxEvent ${e}`);
                    reject(new Error(e));
                });
            } else {
                this.txEventQueue.waitForTransaction(id,resolve)
            }
        });

        const racePromise = Promise.race([eventPromise, timeoutPromise]);

        racePromise.catch(() => {
            clearTimeout(timeoutHandle);
            channelEventHub && channelEventHub.disconnect();
        }).then(() => {
            clearTimeout(timeoutHandle);
            channelEventHub && channelEventHub.disconnect();
        });

        return racePromise;
    }

    _blockNumber(block){ //TODO: move to Block object
        return block.number || _.get(block, "header.number");
    }
    _transactions(block) {
        return block.filtered_transactions || _.map(_.get(block, 'data.data'), d=>{
            const {tx_id, ...rest} = _.get(d,'payload.header.channel_header');
            const {status, ...rest1} = _.get(d, 'payload.data.actions[0].payload.action.proposal_response_payload.extension.response')
            return {txid: tx_id, status: status}
        })
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
            pem: util.loadPemFromFile(`${cfg.ORG_CRYPTO_DIR}/peers/${mspSubPath}/msp/tlscacerts/tlsca.${org || cfg.org}.${domain || cfg.domain}-cert.pem`)
        };
        return connectionOptions;
    }

}

module.exports = FabricStarterClient;
