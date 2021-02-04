const FabricStarterClient = require('$/fabric-starter-client');
const RestSocketServer = require('$/rest-socket-server');
const cfg = require('$/config');
const logger = cfg.log4js.getLogger('DLTNodeRuntime');

class DLTNodeRuntime {

    constructor(httpServerInstance) {
        this.networkList = {};
        this.activeNetwork = null;
        this.httpServerInstance = httpServerInstance;
    }

    async initNodeRuntime(orgName) {
        if (!orgName) return;

        // fabric client
        this.defaultFabricStarterClient = new FabricStarterClient();
        await this.defaultFabricStarterClient.loginOrRegister(cfg.enrollId, cfg.enrollSecret);

        // socket.io server to pass blocks to webapps
        this.socket = new RestSocketServer(this.defaultFabricStarterClient);
        await this.socket.startSocketServer(this.httpServerInstance, cfg.UI_LISTEN_BLOCK_OPTS).then(() => {
            logger.info('started socket server');
        });
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

    getJwtSecret() {
        return this.defaultFabricStarterClient.getSecret()
    }

    getDefaultFabricStarterClient() {
        return this.defaultFabricStarterClient
    }
}

module.exports = DLTNodeRuntime