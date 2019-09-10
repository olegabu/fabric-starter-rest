const logger = require('log4js').getLogger('app');

const express = require('express');
const webAppManager = require('./web-app-manager');

const app = express();
app.disable('etag');

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

glob.sync('./webapps/*').forEach(dir => {
    const appFolder = path.resolve(dir);
    const context = path.basename(dir);
    webAppManager.redeployWebapp(app, context, appFolder);
    logger.info('static webapp', dir);
});