const fs = require('fs');
const _ = require('lodash');
const log4js = require('log4js');
log4js.configure({appenders: {stdout: { type: 'stdout' }},categories: {default: { appenders: ['stdout'], level: 'ALL'}}});
const logger = log4js.getLogger('FabricStarterClient');
const Client = require('fabric-client');
const sdkHelper=require("./sdk-helper");
const fabricCLI = require('./fabric-cli');
const cfg = require('./config.js');


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
    const admin = await this.client.setUserContext({username: registrar.enrollId, password: registrar.enrollSecret});
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

    createOrderer() {
      return sdkHelper.createOrderer(this.client);
        let certData = sdkHelper.loadPemFromFile(cfg.ORDERER_TLS_CERT);// fs.readFileSync(`${cfg.ORDERER_MSP_DIR}/tlscacerts/tlsca.example.com-cert.pem`);
        return this.client.newOrderer(`grpcs://${cfg.ORDERER_ADDR}`, {pem: Buffer.from(certData).toString()});
    }

    async queryPeers(orgName, peer) {
        orgName = orgName || this.org;
        peer = peer || this.peer;
        const peerQueryResponse = await this.client.queryPeers({target: peer}, true);
        let peers = _.get(peerQueryResponse, `peers_by_org.${orgName}.peers`);
        return _.map(peers, p => sdkHelper.createPeerFromUrl(this.client, p.endpoint));
    }

  async queryInstalledChaincodes() {
    const chaincodeQueryResponse = await this.client.queryInstalledChaincodes(this.peer, true);
    return chaincodeQueryResponse.getChaincodes();
  }


    async createChannel(channelId) {

        const tx_id = this.client.newTransactionID(true);

        fabricCLI.downloadOrdererMSP();
        let orderer = sdkHelper.createOrderer(this.client);

        let channelReq = {
            txId: tx_id,
            name: channelId,
            orderer: orderer
        };

        let channelTxContent = await fabricCLI.generateChannelConfigTxContent(channelId);
        var config_update = this.client.extractChannelConfig(channelTxContent);
        channelReq.config = config_update;
        channelReq.signatures = [this.client.signChannelConfig(config_update)];

        let res = await this.client.createChannel(channelReq);
        if (!res || res.status != "SUCCESS") {
            return res;
        }
        return await this.joinChannel(channelId, orderer);
    }

    async joinChannel(channelId) {
        const tx2_id = this.client.newTransactionID(true);
        let orderer=sdkHelper.createOrderer(this.client);
        let channel = this.client.newChannel(channelId);
        channel.addOrderer(orderer);


        // let channelConf = await channel.getChannelConfigFromOrderer();
        let peers = await this.queryPeers();

        channel.addPeer(_.find(peers, p=>_.startsWith(p.getName(),"peer0")) || peer[0]);

        let genesis_block = await channel.getGenesisBlock({txId: tx2_id});

        let gen_tx_id = this.client.newTransactionID(true);
        let j_request = {
            targets: peers,
            block: genesis_block,
            txId: gen_tx_id
        };

        // send genesis block to the peer
        let result = await channel.joinChannel(j_request);
        console.log(`Join channel ${channelId}:`, result);
        return result;
    }


  async getChannel(channelId) {
    let channel;
    try {
      channel = this.client.getChannel(channelId);
    } catch (e) {
      channel = this.client.newChannel(channelId);
      channel.addPeer(this.peer);
    }
    await channel.initialize({discover: true, asLocalhost: asLocalhost});
    // logger.trace('channel', channel);
    return channel;
  }

  getChannelEventHub(channel) {
    //const channelEventHub = channel.getChannelEventHub(this.peer.getName());
    const channelEventHub = channel.newChannelEventHub(this.peer.getName());
    // const channelEventHub = channel.getChannelEventHubsForOrg()[0];
    channelEventHub.connect();
    return channelEventHub;
  }

  async invoke(channelId, chaincodeId, fcn, args, targets, waitForTransactionEvent) {
      let peers = [];
      const channel = await this.getChannel(channelId);
      // if (_.isNil(targets) || _.isEmpty(targets)) {
      //     logger.trace("Used default peer");
      //     peers.push(this.peer);
      // }
      // else {
      //     logger.trace("Used chosen peers");
      //     _.each(targets, function (value) {
      //         let peer = _.find(channel.getChannelPeers(), function (o) {
      //             return o._name === value;
      //         });
      //         if (_.isNil(peer))
      //             logger.error(`Peer ${value} not found`);
      //         else
      //             peers.push(peer);
      //     });
      //     if (_.isEmpty(peers)) {
      //         logger.trace("Used default peer");
      //         peers.push(this.peer);
      //     }
      // }
      _.each(targets, function (value) {
          let peer = _.find(channel.getChannelPeers(), function (o) {
              return o._name === value;
          });
          if (_.isNil(peer))
              logger.error(`Peer ${value} not found`);
          else
              peers.push(peer);
      });
      if (_.isEmpty(peers)) {
          logger.trace("Used default peer");
          peers.push(this.peer);
      }else
          logger.trace("Used chosen peer");
      const tx_id = this.client.newTransactionID(/*true*/);
      const proposal = {
          chaincodeId: chaincodeId,
          fcn: fcn,
          args: args,
          txId: tx_id,
          targets: peers
      };

    logger.trace('invoke', proposal);

    const proposalResponse = await channel.sendTransactionProposal(proposal);

    // logger.trace('proposalResponse', proposalResponse);

    const transactionRequest = {
      proposalResponses: proposalResponse[0],
      proposal: proposalResponse[1],
    };

    const promise = waitForTransactionEvent ? this.waitForTransactionEvent(tx_id, channel) : Promise.resolve(tx_id);

    const broadcastResponse = await channel.sendTransaction(transactionRequest);
    logger.trace('broadcastResponse', broadcastResponse);

    return promise;
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
    let peers = [];
    const channel = await this.getChannel(channelId);
    targets = _.attempt(JSON.parse, targets);
      // let peer = channel.getChannelPeers();
      // if (_.isNil(targets) || _.isEmpty(targets)) {
      //     logger.trace("Used default peer");
      //     peers.push(this.peer);
      // }
      // else {
      //     logger.trace("Used chosen peers");
      //     _.each(targets, function (value) {
      //         peers.push(_.find(peer, function (o) {
      //             return o._name === value;
      //         }));
      //     })
      // }
    _.each(targets, function (value) {
        let peer = _.find(channel.getChannelPeers(), function (o) {
            return o._name === value;
        });
        if (_.isNil(peer))
            logger.error(`Peer ${value} not found`);
        else
            peers.push(peer);
    });
    if (_.isEmpty(peers)) {
        logger.trace("Used default peer");
        peers.push(this.peer);
    }else
        logger.trace("Used chosen peer");
    const request = {
        chaincodeId: chaincodeId,
        fcn: fcn,
        args: args,
        targets: peers
    };

    logger.trace('query', request);

    const responses = await channel.queryByChaincode(request);

    return responses.map(r => {
      return r.toString('utf8');
    });
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
}

module.exports = FabricStarterClient;
