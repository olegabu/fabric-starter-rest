const _ = require('lodash');
const cfg = require('../config');
const FabricStarterClient = require('../fabric-starter-client');
const osnManager = require('../osn-manager');
const logger = cfg.log4js.getLogger('IntegrationManager');


async function createDefaultFabricClient() {
    let client = new FabricStarterClient();
    await client.init();
    await client.loginOrRegister(cfg.enrollId, cfg.enrollSecret);
    return client;
}

const defaultClientPromise = createDefaultFabricClient();

class IntegrationService {


    constructor() {
        this.orgsToAccept = {};
    }

    async acceptOrg(org) {
        logger.info('Org accepting request: ', org);
        if (org.orgId) this.orgsToAccept[org.orgId] = org;
        return `Org is trusted: ${org.orgId}`;
    }

    acceptedOrgsList() {
        return _.map(this.orgsToAccept, e => e);
    }

    async integrateOrg(org) {
        const allowedOrg = await this.checkOrgIsAllowed(org);
        const defaultClient = await this.getDefaultClient();
        const result = defaultClient.addOrgToChannel(cfg.DNS_CHANNEL, org);
        allowedOrg.joined = true;
        return result;
    }

    async registerOrgInDns(org) {
        await this.checkOrgIsAllowed(org);
        const defaultClient = await this.getDefaultClient();
        await defaultClient.checkOrgDns(org);
    }

    async integrateOrderer(orderer) {
        const allowedOrg = await this.checkOrgIsAllowed(orderer);
        const defaultClient = await this.getDefaultClient();
        const result = await osnManager.OsnManager.addRaftConsenter(orderer, defaultClient);
        allowedOrg.ordereJoined = true;
        return result;
    }

    async checkOrgIsAllowed(org) {
        const allowedOrg = this.orgsToAccept[org.orgId];
        logger.info("Check for org presents in the accept list:", allowedOrg);
        if (cfg.ACCEPT_ALL_ORGS ||
                (allowedOrg && !allowedOrg.joined
                    && org.orgIp == allowedOrg.orgIp
                    && org.domain==allowedOrg.domain
                    && org.tlsCert == allowedOrg.tlsCert)) {
            return allowedOrg;
        }
        const errMessage = `Org ${org.orgId} is not allowed`;
        log.error(errMessage);
        throw new Error(errMessage);
    }

    async getDefaultClient() {
        return await defaultClientPromise;
    }
}


module.exports = new IntegrationService();


