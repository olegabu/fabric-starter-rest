const SocketServer = require('socket.io');
const logger = require('log4js').getLogger('RestSocketServer');
const _ = require('lodash');
const cfg = require('./config.js');
const util = require('./util.js');

class RestSocketServer {

    constructor(fabricStarterClient, eventBus) {
        this.listOfChannels = [];
        this.fabricStarterClient = fabricStarterClient;
        this.eventBus = eventBus
    }

  async startSocketServer(server, opts) {
      this.io = new SocketServer(server, {origins: '*:*'});
      this.opts = opts;
      this.startSocketServerTimer();
  }

  startSocketServerTimer() {
      const fabricStarter = this.fabricStarterClient;
      const self = this;
      let channelList = {};
      setInterval(async () => {
          let channels = await fabricStarter.queryChannels();
          logger.debug(`New orgs join check, channels list received:`, channels);
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
                  await self.sendRepeatingBlockNotification(channelId);
              }
              if (!self.channelRegistered(channelId)) {
                  logger.debug(`Found new channel ${channelId}`);
                  await self.registerChannelBlockListener(channelId);
              }
          });
      }, cfg.CHANNEL_LISTENER_UPDATE_TIMEOUT);
  }

    channelRegistered(channelId) {
        return this.listOfChannels.find(i => i === channelId);
    }

  async registerChannelBlockListener(channelId) {
    const self = this;

    await this.fabricStarterClient.registerBlockEvent(channelId, block => {
      let blockNumber = block.number || _.get(block, "header.number");
      logger.debug(`fabricStarterClient has received block ${blockNumber} on ${block.channel_id}`);
      logger.debug(block);
      this.io.emit('chainblock', block);
      this.eventBus && this.eventBus.emit(channelId+"_block", block)
    }, e => {
      logger.error('registerBlockEvent error:', e);
      _.remove(self.listOfChannels, chId=>chId===channelId);
    }, this.opts);
    logger.debug(`registered for block event on ${channelId}`);
    this.listOfChannels.push(channelId);
    return true;
  }

  async sendRepeatingBlockNotification(channel) {
      let info = await this.fabricStarterClient.queryInfo(channel);
      let number = info.height.low-1;
      let block = await this.fabricStarterClient.queryBlock(channel, number, true);
      this.io.emit('chainblock', block)
  }

    async awaitForChannel(channelId) {
        let count = 0;
        while (!this.channelRegistered(channelId) && count < cfg.JOIN_RETRY_COUNT)
            await util.sleep(1000);
        count++;
    }

}

module.exports = RestSocketServer;
