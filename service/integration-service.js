const _ = require('lodash');
const cfg = require('../config');
const osnManager = require('../osn-manager');
const logger = cfg.log4js.getLogger('IntegrationService');

class IntegrationService {

    constructor(fabricStarterRuntime, app) {
        this.fabricStarterRuntime = fabricStarterRuntime
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

    async integrateOrderer(orderer) {
        const allowedOrg = await this.checkOrgIsAllowed(orderer);
        logger.debug("integrateOrderer accepting:", allowedOrg);
        const defaultClient = await this.getDefaultClient();
        const result = await osnManager.OsnManager.addRaftConsenter(orderer, defaultClient);
        allowedOrg.ordererJoined = true;
        return result;
    }

    async integrateOrg(org) {
        const allowedOrg = await this.checkOrgIsAllowed(org);
        logger.debug("integrateOrg accepting:", allowedOrg);
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

    async checkOrgIsAllowed(org) {
        const allowedOrg = this.orgsToAccept[org.orgId];
        logger.info("Check org is in accepted:", allowedOrg, "ACCEPT_ALL_ORGS:", cfg.ACCEPT_ALL_ORGS);
        if (cfg.ACCEPT_ALL_ORGS ||
            (allowedOrg && !allowedOrg.joined
                && org.orgIp == allowedOrg.orgIp
                && org.domain == allowedOrg.domain
                && org.tlsCert == allowedOrg.tlsCert)) {
            logger.debug("checkOrgIsAllowed: accepting ", allowedOrg);
            return allowedOrg || org;
        }
        const errMessage = `Org ${org.orgId} is not allowed`;
        logger.error(errMessage);
        throw new Error(errMessage);
    }

    async getDefaultClient() {
        return this.fabricStarterRuntime.getDefaultFabricStarterClient()
    }
}

module.exports = IntegrationService


