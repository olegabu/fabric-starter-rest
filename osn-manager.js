const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const cfg = require('./config.js');
const logger = cfg.log4js.getLogger('OsmManager');
const certsManager = require('./certs-manager');
const fabricCLI = require('./fabric-cli');
const util = require('./util');

class OsnManager {

    constructor() {
        this.osns = [];
    }

    constructOrdererDomain(org={}, bootstrap={}) {
        return _.get(bootstrap, 'ip') ? `${org.orgId}-${org.domain}` : org.domain //TODO: remove after normalize orderer domain names at deployment
    }

    async addRaftConsenter(newOrderer, fabricStarterClient) {
        logger.debug("Register new orderer DNS info ", newOrderer);
        await this.registerOrdererInCommonChannel(newOrderer, fabricStarterClient);
        this.updateConsenterConfig(newOrderer, cfg.systemChannelId);
        this.updateConsenterConfig(newOrderer, cfg.DNS_CHANNEL);
        let confgiBlockPath = path.join(cfg.CRYPTO_CONFIG_DIR, 'ordererOrganizations', cfg.domain, 'msp', `${newOrderer.ordererName}.${newOrderer.domain}`, 'genesis', `${cfg.systemChannelId}_remote.pb`);
        logger.debug('\n\n            Creating read stream for updated config block file\n\n            ', confgiBlockPath)
        return fs.createReadStream(confgiBlockPath, {encoding: 'binary'})
    }

    async registerOrdererInCommonChannel(orderer, fabricStarterClient) {
        await fabricStarterClient.invoke(cfg.DNS_CHANNEL, 'dns', 'registerOrderer', [JSON.stringify(orderer)], null, true)
            .then(() => util.sleep(cfg.DNS_UPDATE_TIMEOUT));
    }

    updateConsenterConfig(newOrderer, channel) {
        logger.debug(`\n\n\nAdd new consenter config to raft service", Channel: ${channel}`, newOrderer, '\n\n\n');
        let cmd = `container-scripts/orderer/raft-full-add-new-consenter.sh ${newOrderer.ordererName} ${newOrderer.domain} ${newOrderer.ordererPort} ${newOrderer.wwwPort} ${channel}`;
        fabricCLI.execShellCommand(cmd, cfg.YAMLS_DIR, certsManager.getOrdererMSPEnv());

/*
        let cmd = `container-scripts/orderer/raft-add-orderer-msp.sh ${orderer.ordererName} ${orderer.domain} ${orderer.wwwPort} ${channel}`;
        fabricCLI.execShellCommand(cmd, cfg.YAMLS_DIR, certsManager.getOrdererMSPEnv());

        logger.debug("Add new orderer to consenters configuration ", orderer);
        cmd = `container-scripts/orderer/raft-add-consenter.sh ${orderer.ordererName} ${orderer.domain} ${orderer.ordererPort} ${orderer.wwwPort} ${channel}`;
        fabricCLI.execShellCommand(cmd, cfg.YAMLS_DIR, certsManager.getOrdererMSPEnv());

        logger.debug("Add new endpoint to endpoints configuration ", orderer);
        cmd = `container-scripts/orderer/raft-add-endpoint.sh ${orderer.ordererName} ${orderer.domain} ${orderer.ordererPort} ${channel}`;
        fabricCLI.execShellCommand(cmd, cfg.YAMLS_DIR, certsManager.getOrdererMSPEnv());
*/
    }

    init(fabricClient) {
        this.fabricStarterClient = fabricClient;
        this.registerOSN('default', {
            ordererName: cfg.ordererName,
            domain: cfg.ordererDomain,
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