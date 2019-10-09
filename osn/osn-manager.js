const _ = require('lodash');
const cfg = require('../config.js');
const certsManager = require('../certs-manager');

class OsnManager {

    constructor() {
        this.osns = [];
    }

    init(fabricClient) {
        this.fabricStarterClient = fabricClient;
        this.registerOSN('default', {ordererName: cfg.ordererName, ordererDomain: cfg.ORDERER_DOMAIN, ordererPort: cfg.ordererPort});
    }

    registerOSN(osnName, ...ordererConfig) {
        let osn = _.find(this.osns, o=>o.name===osnName) ;
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
        if (ordererIndex!==-1){
            this.orderers[ordererIndex]=orderer;
        } else
            this.orderers.push(orderer);
    }

    getOrderers() {
        return _.map(this.orderers, o=>o.name);
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