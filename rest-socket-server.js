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

    for (const channelId of channels.map(c => {
        return c.channel_id;
    })) {
      await this.registerChannelChainblockListener(channelId);
    }
      this.startSocketServerTimer();
  }

  startSocketServerTimer() {
      const fabricStarter = this.fabricStarterClient;
      const self = this;
      let channelList = {};
      setInterval(async () => {
          const channels = await fabricStarter.queryChannels();
          _.forEach(channels, async channel => {
              let channelId = channel.channel_id;
              let peers = await fabricStarter.getPeersForOrgOnChannel(channelId);
              let newPeersFound = false;
              if (channelList[channelId] && !self.listOfChannels.find(chId=>chId===channelId)) {
                  logger.debug("Renew event listener for channel ", channelId);
                  delete channelList[channelId];
              }
              _.forEach(peers, peerName => {
                  if (!_.get(channelList, `${channelId}["${peerName}"]`)) {
                      _.set(channelList, `${channelId}["${peerName}"]`, true);
                      logger.debug(`Found new peer ${peerName} on channel ${channelId}`);
                      newPeersFound = true;
                  }
              });
              if (newPeersFound && self.listOfChannels.find(i => i === channelId)) {
                  await self.sendRepeatableBlock(channelId);
              }
              if (!self.listOfChannels.find(i => i === channelId)) {
                  logger.debug(`Found new channel ${channelId}`);
                  await self.registerChannelChainblockListener(channelId);
              }
          });
      }, cfg.CHANNEL_LISTENER_UPDATE_TIMEOUT);
  }


  async registerChannelChainblockListener(channelId) {
    const self = this;

    await this.fabricStarterClient.registerBlockEvent(channelId, block => {
      let blockNumber = block.number || _.get(block, "header.number");
      logger.debug(`fabricStarterClient hase received block ${blockNumber} on ${block.channel_id}`);
      logger.debug(block);
      this.io.emit('chainblock', block);
    }, e => {
      logger.error('registerBlockEvent error:', e);
      _.remove(self.listOfChannels, chId=>chId===channelId);
    }, this.opts);
    logger.debug(`registered for block event on ${channelId}`);
      this.listOfChannels.push(channelId);
    return true;
  }

  async sendRepeatableBlock(channel) {
      let info = await this.fabricStarterClient.queryInfo(channel);
      let number = info.height.low-1;
      let block = await this.fabricStarterClient.queryBlock(channel, number, true);
      this.io.emit('chainblock', block)
  }
}

module.exports = RestSocketServer;
