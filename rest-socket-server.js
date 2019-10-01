const SocketServer = require('socket.io');
const logger = require('log4js').getLogger('RestSocketServer');
const _ = require('lodash');
const cfg = require('./config.js');

class RestSocketServer {

  constructor(fabricStarterClient) {
    if(!fabricStarterClient) {
      const FabricStarterClient = require('./fabric-starter-client');
      fabricStarterClient = new FabricStarterClient();
      fabricStarterClient.init();
    }
    this.listOfChannels = {};
    this.fabricStarterClient = fabricStarterClient;
  }

  async startSocketServer(server, opts) {
      this.io = new SocketServer(server, {origins: '*:*'});
      this.opts = opts;
      this.startSocketServerTimer();
  }

    startSocketServerTimer() {
        const fabricStarter = this.fabricStarterClient;
        const self = this;
        setInterval(async () => {
            await self.refreshChannelInfo(fabricStarter);
        }, cfg.CHANNEL_LISTENER_UPDATE_TIMEOUT);
    }

    async refreshChannelInfo(fabricStarter) {
        let channels = await fabricStarter.queryChannels();
        logger.debug(`New orgs join check, channels list received:`, channels);
        _.forEach(channels, async channel => {
            let channelId = channel.channel_id;
            let peers = await fabricStarter.getPeersForOrgOnChannel(channelId);
            let channelKnownPeers = this.listOfChannels[channelId];
            if (channelKnownPeers) {
                const newPeers = _.difference(peers, channelKnownPeers);
                if (!_.isEmpty(newPeers)) {
                    await this.sendRepeatingBlockNotification(channelId, peers);
                }
            } else {
                logger.debug(`Found new channel ${channelId}`);
                await this.registerChannelChainblockListener(channelId, peers);
            }
        });
    }

    async registerChannelChainblockListener(channelId, channelKnownPeers) {
        const self = this;

        await this.fabricStarterClient.registerBlockEvent(channelId, block => {
            let blockNumber = block.number || _.get(block, "header.number");
            logger.debug(`fabricStarterClient has received block ${blockNumber} on ${block.channel_id}`, block);
            this.io.emit('chainblock', block);
        }, e => {
            logger.error('registerBlockEvent error:', e);
            _.remove(self.listOfChannels, chId => chId === channelId);
        }, this.opts);
        logger.debug(`registered for block event on ${channelId}`);
        this.listOfChannels[channelId] = channelKnownPeers;
        return true;
    }

    async sendRepeatingBlockNotification(channelId, channelKnownPeers) {
        let info = await this.fabricStarterClient.queryInfo(channelId);
        let number = info.height.low - 1;
        let block = await this.fabricStarterClient.queryBlock(channelId, number, true);
        this.listOfChannels[channelId] = channelKnownPeers;
        this.io.emit('chainblock', block);
    }
}

module.exports = new RestSocketServer();
