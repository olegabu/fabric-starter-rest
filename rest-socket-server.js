const SocketServer = require('socket.io');
const logger = require('log4js').getLogger('RestSocketServer');
const _ = require('lodash');
const cfg = require('./config.js');
const util = require('./util.js');

class RestSocketServer {

    constructor(fabricStarterClient, txEventQueue) {
        this.listOfChannels = [];
        this.fabricStarterClient = fabricStarterClient;
        this.txEventQueue = txEventQueue
        this.rate={}
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

    checkRate(lastBlockNumber) {
        const time = new Date();
        const elapsedSeconds = ((time - this.rate.lastSentTime) || 1000 ) / 1000
        const committedBlocks = lastBlockNumber - (this.rate.lastSentBlock || lastBlockNumber)
        let result = false
        if (committedBlocks / elapsedSeconds < .5 || time - (this.rate.lastTime || 0) > 1000) {
            result = true
        }
        if (committedBlocks / elapsedSeconds >= 0.5 && (committedBlocks / elapsedSeconds <= 10) && (lastBlockNumber / 10 === Math.floor(lastBlockNumber / 10))) {
            result = true
        }
        if (committedBlocks / elapsedSeconds > 10  && (lastBlockNumber / 100 === Math.floor(lastBlockNumber / 100))) {
            result = true
        }

        this.rate.lastTime = time
        if (result) {
            this.rate.lastSentTime = time
            this.rate.lastSentBlock = lastBlockNumber
        }
        return result;
    }

    emitIOEventWithRateCheck(blockNumber, block) {
        if (this.checkRate(blockNumber)) {
            this.io.emit('chainblock', block);
            this.rate.timer && clearTimeout(this.rate.timer)
        } else {
            this.rate.timer && clearTimeout(this.rate.timer)
            this.rate.timer = setTimeout(() => this.io.emit('chainblock', block), 5000)
        }
    }

  async registerChannelBlockListener(channelId) {
    const self = this;

    await this.fabricStarterClient.registerBlockEvent(channelId, block => {
      let blockNumber = block.number || _.get(block, "header.number");
      logger.debug(`fabricStarterClient has received block ${blockNumber} on ${block.channel_id}`);
      logger.debug(block);
      this.emitIOEventWithRateCheck(blockNumber, block)
      this.emitTxChainBlockEvent(block);
    }, e => {
      logger.error('registerBlockEvent error:', e);
      _.remove(self.listOfChannels, chId=>chId===channelId);
    }, this.opts);
    logger.debug(`registered for block event on ${channelId}`);
    this.listOfChannels.push(channelId);
    return true;
  }

    emitTxChainBlockEvent(block) {
        this.txEventQueue && this.txEventQueue.emitChainblock(block)
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
