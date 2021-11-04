const glob = require('glob');
const path = require('path');
const _ = require('lodash');

const FabricStarterClient = require('../../fabric-starter-client');
const RestSocketServer = require('../../rest-socket-server');
const cfg = require('../../config');
const logger = cfg.log4js.getLogger('NodeRuntime');
const appManager = require('../../app-manager');
const IntegrationService = require('../../service/integration-service');
const ChaincodeService = require('../../service/chaincode/chaincode-service');
const LedgerStorage = require('../storage/ledger-storage')
const util = require('../../util');
const Fabric1xAdapter = require('../../service/context/fabricversions/fabric-1x-adapter') // todo: load adapters automatically
const Fabric2xAdapter = require('../../service/context/fabricversions/fabric-2x-adapter')

class FabricStarterRuntime {

    constructor(app, server) {
        this.networkList = {};
        this.activeNetwork = null;
        this.app = app;
        this.server = server;
        this.initialized = false
    }

    async setOrg(org = {}) {
        if (!org.orgId || !org.domain)
            return false;

        await this.initDefaultFabricStarterClient()//TODO: move to separate class
        this.initialized = false
        return true
    }

    async tryInitRuntime(org = {}) {
        logger.debug('Runtime is initialised: ', this.initialized)
        if (!this.initialized) {

            if (!await util.checkRemotePort(cfg.addressFromTemplate(cfg.peerName, org.orgId, org.domain), org.peer0Port, {
                throws: false, timeout: 3000, from: 'tryInitRuntime'
            })) {
                return
            }

            logger.debug('Init runtime')
            this.initFabricVersionAdapter(cfg.FABRIC_VERSION)
            await this.initSocketServer();
            this.initApps()
            this.initJwtApi()
            this.chaincodeService = new ChaincodeService(this)
            this.storageService = new LedgerStorage(this, cfg.DNS_CHANNEL, cfg.DNS_CHAINCODE, 'chaincodes')
            this.initStorageApi(this)
            await this.initApi(this.chaincodeService, this.storageService);
            this.integrationService = new IntegrationService(this)
            this.initIntegrationApi()
            this.initialized = true
        }
    }

    async initDefaultFabricStarterClient() {
        // fabric client
        this.defaultFabricStarterClient = new FabricStarterClient();
        try {
            await this.defaultFabricStarterClient.loginOrRegister(cfg.ENROLL_ID, cfg.enrollSecret);
        } catch (e) {
            logger.debug(e)
        }

        try {
            const tlsNetworkConfigProvider = require('../../network');
            this.tlsFabricStarterClient = new FabricStarterClient(tlsNetworkConfigProvider(cfg.tlsCas, 'tls'));
            await this.tlsFabricStarterClient.loginOrRegister(cfg.ENROLL_ID, cfg.enrollSecret);
        } catch (e) {
            logger.debug(e)
        }

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
        require('../../api/jwt-api')(this.app, this.server, this.defaultFabricStarterClient);
    }

    async initApi(chaincodeService, storageService) {
        await require('../../api')(this.app, this.server, this, chaincodeService, storageService)
    }

    initIntegrationApi() {
        require('../../api/integration-api')(this.app, this.server, this.integrationService)
    }

    initStorageApi(fabricStarterRuntime) {
        require('../../api/storage-api')(fabricStarterRuntime.app, fabricStarterRuntime.server, fabricStarterRuntime.storageService)
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

    getTLSFabricStarterClient() {
        return this.tlsFabricStarterClient
    }

    initFabricVersionAdapter(version) {
        if (_.startsWith(version, "2.")) {
            this.fabricVersionAdapter = new Fabric2xAdapter(this)
        } else if (_.startsWith(version, "1.")) {
            this.fabricVersionAdapter = new Fabric1xAdapter(this)
        }
    }

    getFabricVersionAdapter() {
        return this.fabricVersionAdapter
    }
}

module.exports = FabricStarterRuntime