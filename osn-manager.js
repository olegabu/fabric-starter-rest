const _ = require('lodash');
const cfg = require('./config.js');
const logger = cfg.log4js.getLogger('osn-manager');
const certsManager = require('./certs-manager');
const fabricCLI = require('./fabric-cli');
const util = require('./util');

class OsnManager {

    constructor() {
        this.osns = [];
    }

    async addRaftConsenter(orderer, fabricStarterClient) {
        logger.debug("Register new orderer DNS info ", orderer);
        await this.registerOrdererInCommonChannel(orderer, fabricStarterClient);
        this.updateConsenterConfig(orderer, cfg.systemChannelId);
        this.updateConsenterConfig(orderer, cfg.DNS_CHANNEL);
    }

    async registerOrdererInCommonChannel(orderer, fabricStarterClient) {
        await fabricStarterClient.invoke(cfg.DNS_CHANNEL, 'dns', 'registerOrderer', [JSON.stringify(orderer)], null, true)
            .then(() => util.sleep(cfg.DNS_UPDATE_TIMEOUT));
    }

    updateConsenterConfig(orderer, channel) {
        logger.debug("Add new orderer MSP config to raft service", orderer);
        let cmd = `container-scripts/orderer/raft-add-orderer-msp.sh ${orderer.ordererName} ${orderer.domain} ${orderer.wwwPort} ${channel}`;
        fabricCLI.execShellCommand(cmd, cfg.YAMLS_DIR, certsManager.getOrdererMSPEnv());

        logger.debug("Add new orderer to consenters configuration ", orderer);
        cmd = `container-scripts/orderer/raft-add-consenter.sh ${orderer.ordererName} ${orderer.domain} ${orderer.ordererPort} ${orderer.wwwPort} ${channel}`;
        fabricCLI.execShellCommand(cmd, cfg.YAMLS_DIR, certsManager.getOrdererMSPEnv());

        logger.debug("Add new endpoint to endpoints configuration ", orderer);
        cmd = `container-scripts/orderer/raft-add-endpoint.sh ${orderer.ordererName} ${orderer.domain} ${orderer.ordererPort} ${channel}`;
        fabricCLI.execShellCommand(cmd, cfg.YAMLS_DIR, certsManager.getOrdererMSPEnv());
    }

    init(fabricClient) {
        this.fabricStarterClient = fabricClient;
        this.registerOSN('default', {
            ordererName: cfg.ordererName,
            domain: cfg.ORDERER_DOMAIN,
            ordererPort: cfg.ordererPort
        });
    }

    registerOSN(osnName, ...ordererConfig) {
        let osn = _.find(this.osns, o => o.name === osnName);
        if (!osn) {
            osn = new OSN(osnName);
            this.osns.push(osn);
        }
        _.forEach(ordererConfig, conf => {
            let orderer = this.createOrdererFromPath(conf);
            osn.addOrderer(orderer);
        });
    }


    createOrdererFromPath({ordererName, ordererDomain, ordererPort}) {
        let ordererAddr = this.createOrdererAddress({ordererName, ordererDomain, ordererPort});
        const ordererRootTLSFile = certsManager.getOrdererRootTLSFile(ordererName, ordererDomain);
        return this.createOrdererWrapper(ordererAddr, ordererRootTLSFile);
    }

    createOrdererWrapper(addr, ordererRootTLSFile) {
        const orderer = {addr, ordererRootTLSFile}; //this.fabricStarterClient.createOrdererWrapper(addr, ordererRootTLSFile);
        return orderer;
    }

    getOsns() {
        return this.osns;
    }

    getOsn(osnName) {
        return _.find(this.osns, i => i.getName() === osnName);
    }

    // getOrderer(ordererAddr, osnName = 'default') {
    //     const osn = getOsn(osnName);
    //     return osn && osn.getOrderer(ordererAddr)
    // }

    createOrdererAddress({ordererName, ordererDomain, ordererPort}) {
        return `${ordererName}.${ordererDomain}:${ordererPort}`;
    }

}


class OSN {

    constructor(name) {
        this.name = name;
        this.orderers = [];
    }

    addOrderer(orderer) {
        const ordererIndex = this.getOrdererIndex(_.get(orderer, "addr"));
        if (ordererIndex !== -1) {
            this.orderers[ordererIndex] = orderer;
        } else
            this.orderers.push(orderer);
    }

    getOrderers() {
        return _.map(this.orderers, o => o.name);
        // return this.orderers;
    }

    getOrdererIndex(addr) {
        return _.findIndex(this.orderers, o => o.addr === addr);
    }

}


module.exports = {
    OsnManager: new OsnManager(),
    OSN: OSN
};