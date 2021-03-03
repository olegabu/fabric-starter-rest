const express = require('express');
const bodyParser = require("body-parser");
const cors = require('cors');

const cfg = require('$/config');
const logger = cfg.log4js.getLogger('app');
const FabricStarterRuntime = require('./service/context/fabric-starter-runtime');

(async function() {

    const app = initAppExpress();
    const server = startHttpAppServer(app);

    initManagementApi(app, server);
    await tryInitRuntime(app, server);

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

    function initManagementApi(app, server) {
        require('./api/node-components-management-api')(app, server);
    }

    async function tryInitRuntime(app, server) {
        const fabricStarterRuntime = new FabricStarterRuntime(app, server)
        await fabricStarterRuntime.tryInitRuntime(cfg.org)
    }
})()
