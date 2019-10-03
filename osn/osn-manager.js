const _ = require('lodash');
const cfg = require('../config.js');
const certsManager = require('../certs-manager');

class OsnManager {

    constructor() {
        this.osns = [];
    }

    init(fabricClient) {
        this.fabricStarterClient = fabricClient;
        this.initOsnWrapper('default', {ordererName: cfg.ordererName, ordererDomain: cfg.ORDERER_DOMAIN, ordererPort: cfg.ordererPort});
        this.initOsnWrapper('raft-osn', {ordererName: cfg.ordererName, ordererDomain: cfg.ORDERER_DOMAIN, ordererPort: cfg.ordererPort});
    }

    initOsnWrapper(osnName, ...ordererConfig) {
        const osn = new OSN(osnName);
        _.forEach(ordererConfig, conf => {
            let orderer = this.initOrdererFromPath(conf);
            osn.addOrderer(orderer);
        });
        this.osns.push(osn);
    }

    initOrdererFromPath({ordererName, ordererDomain, ordererPort}) {
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

    getOrderer(ordererAddr, osnName = 'default') {
        const osn = getOsn(osnName);
        return osn && osn.getOrderer(ordererAddr)
    }

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
        this.orderers.push(orderer);
    }

    getOrderers() {
        return _.map(this.orderers, o=>o.name);
        // return this.orderers;
    }

    getOrderer(addr) {
        _.find(this.orderers, o => o.addr === addr);
    }

}


module.exports = {
    OsnManager: new OsnManager(),
    OSN: OSN
};