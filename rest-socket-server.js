const SocketServer = require('socket.io');
const logger = require('log4js').getLogger('RestSocketServer');
const _ = require('lodash');

class RestSocketServer {

  constructor(fabricStarterClient) {
    if(!fabricStarterClient) {
      const FabricStarterClient = require('./fabric-starter-client');
      fabricStarterClient = new FabricStarterClient();
    }

    this.fabricStarterClient = fabricStarterClient;
  }

  async startSocketServer(server, opts) {
    this.io = new SocketServer(server, {origins: '*:*'});
    const channels = await this.fabricStarterClient.queryChannels();
    this.opts = opts;

    channels.map(c => {
      return c.channel_id;
    }).forEach(async channelId => {
      await this.updateServer(channelId);
    });
  }

  async updateServer(channel) {

    await this.fabricStarterClient.registerBlockEvent(channel, block => {
      let blockNumber = block.number || _.get(block, "header.number");
      logger.debug(`fabricStarterClient hase recived block ${blockNumber} on ${block.channel_id}`);
      logger.debug(block);
      this.io.emit('chainblock', block);
    }, e => {
      logger.error('registerBlockEvent error:', e);
    }, this.opts);
    logger.debug(`registered for block event on ${channel}`);
  }

  async retryJoin(nTimes, fn) {
    if(nTimes <= 0) {
      logger.error(`Invocation unsuccessful for 10 retries.`);
      return;
    }
    try {
      return await fn();
    } catch(err) {
      logger.trace(`Error: `, err, `\nRe-trying invocation: ${nTimes}.`);
      setTimeout(async () => {
        await this.retryJoin(--nTimes, fn);
      }, 3000);
    }
  }
}

module.exports = RestSocketServer;
