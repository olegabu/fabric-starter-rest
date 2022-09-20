const express = require('express');
const bodyParser = require("body-parser");
const cors = require('cors');

const cfg = require('./config');
const logger = cfg.log4js.getLogger('app');
const FabricStarterRuntime = require('./service/context/fabric-starter-runtime');
const NodeComponentsManager = require('./service/nodecomponents/node-components-manager');
const Org = require("./model/Org");

let server;

(async function () {
    const app = initAppExpress();
    server = startHttpAppServer(app);
    initStaticApi(app, server);

    const fabricStarterRuntime = new FabricStarterRuntime(app, server)
    const nodeComponentsManager = new NodeComponentsManager(fabricStarterRuntime)
    initManagementApi(app, server, nodeComponentsManager)
    const defaultOrg = Org.fromConfig(cfg);
    if (await fabricStarterRuntime.setOrg(defaultOrg)) {
        await fabricStarterRuntime.tryInitRuntime(defaultOrg)
    }
})()

function startHttpAppServer(app) {
    app.disable('etag');
    const server = app.listen(process.env.PORT || 3000, () => {
        logger.info('started fabric-starter rest server on port', server.address().port);
    });

    return server;
}

function initAppExpress() {
    const app = express();
    app.use(bodyParser.json({limit: '100MB', type: 'application/json'}));
    app.use(bodyParser.urlencoded({extended: true, limit: '100MB'}));

    // allow CORS from all urls
    app.use(cors());
    app.options('*', cors());

    return app;
}

function initStaticApi(app, server) {
    require('./api/static-api')(app, server);
}

function initManagementApi(app, server, nodeComponentsManager) {
    require('./api/node-components-management-api')(app, server, nodeComponentsManager);
}

function stopServer() {
    server && server.close()
}

module.exports = {
    stopServer: stopServer
}