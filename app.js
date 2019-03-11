const logger = require('log4js').getLogger('app');

const express = require('express');
const app = express();

const server = app.listen(process.env.PORT || 3000, () => {
  logger.info('started fabric-starter rest server on port', server.address().port);
});

const api = require('./api');
api(app, server);

// serve
const glob = require('glob');
const path = require('path');
glob.sync('./routes/**/*.js').forEach(file => {
  const route = require(path.resolve(file));
  route(app);
  logger.info('started route', file);
});