const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const cfg = require('../config');
const log4jsConfigured = require('../util/log/log4js-configured');
const logger = log4jsConfigured.getLogger('IntegrationService');
const osnManager = require('../osn-manager');

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

    async integrateOrderer(orderer, certFiles) {
        if (_.isEqual(orderer.domain, cfg.ordererDomain)) {
            throw new Error(`\nConsenter with ${cfg.ordererDomain} should already be integrated\n`)
        }
        const allowedOrg = await this.checkOrgIsAllowed(orderer);
        logger.debug("integrateOrderer accepting:", allowedOrg);
        const defaultClient = await this.getDefaultClient();
        const stream = await osnManager.OsnManager.addRaftConsenter(orderer, defaultClient, certFiles);
        allowedOrg.ordererJoined = true;
        return stream;
    }

    async integrateOrg(org, certFiles) {
        if (_.isEqual(org.orgId, cfg.org)) {
            throw new Error(`\nOrg ${org.orgId}.${cfg.domain} should already be in the network\n`)
        }
        const allowedOrg = await this.checkOrgIsAllowed(org);
        logger.debug("integrateOrg accepting:", allowedOrg);
        // await fs.emptyDir(path.join(cfg.TMP_DIR, 'peerOrganizations'));
        // await async.everySeries(certFiles, async certFile => {
        //     await mspManager.unpackMsp(certFile, cfg.TMP_DIR);
        // })
        const defaultClient = await this.getDefaultClient();
        const result = await defaultClient.addOrgToChannel(cfg.DNS_CHANNEL, org, certFiles);
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
        if ((cfg.ACCEPT_ALL_ORGS && _.isEmpty(this.orgsToAccept))
            || (allowedOrg && !allowedOrg.joined
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


