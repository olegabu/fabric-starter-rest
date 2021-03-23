const glob = require('glob');
const path = require('path');

const FabricStarterClient = require('$/fabric-starter-client');
const RestSocketServer = require('$/rest-socket-server');
const cfg = require('$/config');
const logger = cfg.log4js.getLogger('NodeRuntime');
const appManager = require('$/app-manager');
const IntegrationService = require('$/service/integration-service');
const util = require('$/util');

class FabricStarterRuntime {

    constructor(app, server) {
        this.networkList = {};
        this.activeNetwork = null;
        this.app = app;
        this.server = server;
        this.initialized = false
    }

    async tryInitRuntime(org = {}) {
        logger.debug('Runtime is initialised: ', this.initialized)
        if (!this.initialized) {
            if (!org.orgId || !org.domain)
                return;
            if (!await util.checkRemotePort(`${cfg.peerName}.${org.orgId}.${org.domain}`, org.peer0Port, {
                throws: false,
                timeout: 6000,
                from: 'tryInitRuntime'
            }))

            logger.debug('Init runtime')
            await this.initDefaultFabricStarterClient();
            await this.initSocketServer();
            this.initApps()
            this.initJwtApi()
            await this.initApi();
            this.integrationService = new IntegrationService(this)
            this.initIntegrationApi()
            this.initialized = true
        }
    }

    async initDefaultFabricStarterClient() {
        // fabric client
        this.defaultFabricStarterClient = new FabricStarterClient();
        await this.defaultFabricStarterClient.loginOrRegister(cfg.ENROLL_ID, cfg.enrollSecret);
    }

    async initSocketServer() {
        // socket.io server to pass blocks to webapps
        this.socket = new RestSocketServer(this.defaultFabricStarterClient);
        await this.socket.startSocketServer(this.server, cfg.UI_LISTEN_BLOCK_OPTS).then(() => {
            logger.info('started socket server');
        });
    }

    initApps() {
        // serve
        glob.sync(`${cfg.MIDDLWARE_DIR}/**/*.js`).forEach(file => {
            const route = require(path.resolve(file));
            route(this.app);
            logger.info('started route', file);
        });

        glob.sync(`${cfg.WEBAPPS_DIR}/*`).forEach(dir => {
            const appFolder = path.resolve(dir);
            const context = path.basename(dir);
            appManager.redeployWebapp(this.app, context, appFolder);
            logger.info('static webapp', dir);
        });

        appManager.redeployAllAppstoreApps(this.app);
    }

    initJwtApi() {
        require('$/api/jwt-api')(this.app, this.server, this.defaultFabricStarterClient);
    }

    async initApi() {
        await require('$/api')(this.app, this.server, this)
    }

    initIntegrationApi() {
        require('$/api/integration-api')(this.app, this.server, this.integrationService)
    }


    addNetwork(name, dltNetwork) {
        this.deactivateNetwork(name);
        this.networkList[name] = dltNetwork
    }

    getActiveNetwork() {
        return this.activeNetwork
    }

    setActiveNetwork(name) {
        this.activeNetwork = this.getNetwork(name)
    }

    deactivateNetwork(name) {
        let network = this.getNetwork(name);
        network.logout()
    }

    async registerChannelBlockListener(channelId) {
        await this.socket.registerChannelBlockListener(channelId);
    }

    async subscribeToChannelEvents(channelId) {
        await this.socket.awaitForChannel(channelId)
    }

    getNetwork(name) {
        let network = this.networkList[name];
        if (!network) {
            throw new Error(`no such network ${name}`);
        }
        return network;
    }

    getDefaultFabricStarterClient() {
        return this.defaultFabricStarterClient
    }
}

module.exports = FabricStarterRuntime