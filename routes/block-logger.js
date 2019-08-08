module.exports = async app => {
  const logger = require('log4js').getLogger('block-logger');
  const FabricStarterClient = require('../fabric-starter-client');
  const fabricStarterClient = new FabricStarterClient();

  await fabricStarterClient.init();

  const channels = await fabricStarterClient.queryChannels();
  logger.info('channels', channels);

  channels.forEach(async o => {
    await fabricStarterClient.registerBlockEvent(o.channel_id, block => {
      logger.debug(`block ${block.number || (block.header && block.header.number)} on ${block.channel_id}`);
    }, e => {
      logger.error('registerBlockEvent', e);
    });

    logger.info(`registered for block event on ${o.channel_id}`);
  });

  // app.get('/block-logger', (req, res) => {
  //   res.status(200).send(`Welcome to block-logger. Channels: ${channels}`);
  // });

  logger.info('started');
};
