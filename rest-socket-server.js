const SocketServer = require('socket.io');
const logger = require('log4js').getLogger('RestSocketServer');
const _ = require('lodash');
const cfg = require('./config.js');

class RestSocketServer {

  constructor(fabricStarterClient) {
    if(!fabricStarterClient) {
      const FabricStarterClient = require('./fabric-starter-client');
      fabricStarterClient = new FabricStarterClient();
    }
    this.listOfChannels = [];
    this.fabricStarterClient = fabricStarterClient;
  }

  async startSocketServer(server, opts) {
    const self = this;
    this.io = new SocketServer(server, {origins: '*:*'});
    const channels = await this.fabricStarterClient.queryChannels();
    this.opts = opts;

    channels.map(c => {
      return c.channel_id;
    }).forEach(async channelId => {
        self.listOfChannels.push(channelId);
      await this.registerChannelChainblockListener(channelId);
    });
    this.startSocketServerTimer();
  }

  startSocketServerTimer() {
      const fabricStarter = this.fabricStarterClient;
      const self = this;
      let channelList = {};
      setInterval(async function () {
          const channels = await fabricStarter.queryChannels();
          channels.map(c => c.channel_id).forEach(async channelId => {
              let peers = await fabricStarter.getPeersForOrgOnChannel(channelId);
              let newPeersFound = false;
              _.forEach(peers, peerName => {
                  if (!_.get(channelList, `${channelId}["${peerName}"]`)) {
                      _.set(channelList, `${channelId}["${peerName}"]`, true);
                      newPeersFound = true;
                  }
              });
              if (newPeersFound && self.listOfChannels.find(i => i === channelId)) {
                  self.sendRepeatableBlock(channelId);
              }
              if (!self.listOfChannels.find(i => i === channelId)) {
                  if (await self.registerChannelChainblockListener(channelId)) {
                      self.listOfChannels.push(channelId);
                  }
              }
          });
      }, cfg.CHANNEL_LISTENER_UPDATE_TIMEOUT);
  }


  async registerChannelChainblockListener(channel) {

    await this.fabricStarterClient.registerBlockEvent(channel, block => {
      let blockNumber = block.number || _.get(block, "header.number");
      logger.debug(`fabricStarterClient hase recived block ${blockNumber} on ${block.channel_id}`);
      logger.debug(block);
      this.io.emit('chainblock', block);
    }, e => {
      logger.error('registerBlockEvent error:', e);
      return false;
    }, this.opts);
    logger.debug(`registered for block event on ${channel}`);
    return true;
  }

  async sendRepeatableBlock(channel) {
      let info = await this.fabricStarterClient.queryInfo(channel);
      let number = info.height.low-1;
      this.io.emit('chainblock', {channel_id: channel, number: number.toString()})
  }
}

module.exports = RestSocketServer;
