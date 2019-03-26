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

    channels.map(c => {
      return c.channel_id;
    }).forEach(async channelId => {
      await this.updateServer(channelId, opts);
    });
  }

  async updateServer(channel, opts) {

    await this.fabricStarterClient.registerBlockEvent(channel, block => {
      let blockNumber = block.number || _.get(block, "header.number");
      logger.debug(`block ${blockNumber} on ${block.channel_id}`);
      this.io.emit('chainblock', block);
    }, e => {
      logger.error('registerBlockEvent', e);
    }, opts);
    logger.debug(`registered for block event on ${channel}`);
  }

  async retryJoin(nTimes, fn) {
    if(nTimes <= 0) {
      logger.error(`Invocation unsuccessful for 10 retries.`);
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
