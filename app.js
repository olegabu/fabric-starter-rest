const EventEmitter = require('events');
const express = require('express');
const glob = require('glob');
const path = require('path');

const logger = require('log4js').getLogger('app');
const cfg = require('./config.js');

const FabricStarterClient = require('./fabric-starter-client');
const webAppManager = require('./web-app-manager');

(function start() {
    const app = express();
    app.disable('etag');

    const fabricStarterClient = new FabricStarterClient();
    fabricStarterClient.init();

    const eventBus = new EventEmitter();
    const httpServer = startHttpSerevr();
    const socketServer = startWebSocketServer(httpServer);
    const osnManager = startOsnManager(fabricStarterClient);

    startRestApi(app, socketServer, fabricStarterClient, eventBus, osnManager);
    startDeploymentApi(app, eventBus, socketServer);
    registerMiddlewares(app, fabricStarterClient, eventBus);
    registerWebapps(app);
    startEventHandlers(eventBus, socketServer, osnManager);

    //end

    function startHttpSerevr() {
        const server = app.listen(process.env.PORT || 3000, () => {
            logger.info('started fabric-starter rest server on port', server.address().port);
        });
        return server;
    }

    function startWebSocketServer(server) {
        // socket.io server to pass blocks to webapps
        const socketServer = require('./rest-socket-server');
        socketServer.startSocketServer(server, cfg.UI_LISTEN_BLOCK_OPTS).then(() => {
            logger.info('started socket server');
        });
        return socketServer;
    }

    function startOsnManager(fabricStarterClient) {
        const osnManager= require('./osn/osn-manager').OsnManager;
        osnManager.init(fabricStarterClient);
        return osnManager;
    }

    function startRestApi(app, socketServer, fabricStarterClient, eventBus, osnManager) {
        require('./api')(app, socketServer, fabricStarterClient, eventBus, osnManager);
    }

    function startDeploymentApi(app, eventBus, socketServer) {
        require('./deployment')(app, eventBus, socketServer);
    }

    function registerMiddlewares(app, fabricStarterClient, eventBus) {
        glob.sync('./routes/**/*.js').forEach(file => {
            const route = require(path.resolve(file));
            route(app, fabricStarterClient, eventBus);
            logger.info('started route', file);
        });
    }

    function registerWebapps(app) {
        glob.sync('./webapps/*').forEach(dir => {
            const appFolder = path.resolve(dir);
            const context = path.basename(dir);
            webAppManager.redeployWebapp(app, context, appFolder);
            logger.info('static webapp', dir);
        });
    }

    function startEventHandlers(eventBus, socketServer, osnManager) {
        require("./event/handling")(eventBus, socketServer, osnManager);
    }

})();

