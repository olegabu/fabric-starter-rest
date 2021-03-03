const asyncMiddleware = require('$/api/async-middleware-error-handler');
const cfg = require('$/config');
const logger = cfg.log4js.getLogger('IntegrationApi');

module.exports = function (app, server, integrationService) {

    app.post('/service/accept/orgs', asyncMiddleware(async (req, res) => {
        res.json(integrationService.acceptOrg(req.body))
    }));

    app.get('/service/accepted/orgs', asyncMiddleware((req, res) => {
        res.json(integrationService.acceptedOrgsList());
    }));

    app.post('/integration/service/orgs', asyncMiddleware(async (req, res) => {
        logger.info('Org integration service request: ', req.body);
        try {
            res.json(await integrationService.integrateOrg(orgFromHttpBody(req.body)))
        } catch (e) {
            logger.error(e);
            res.status(401).json(e);
        }
    }));

    app.post('/integration/dns/org', asyncMiddleware(async (req, res) => {
        logger.info('Dns integration service request: ', req.body);
        try {
            res.json(await integrationService.registerOrgInDns(orgFromHttpBody(req.body)))
        } catch (e) {
            logger.error(e);
            res.status(401).json(e);
        }
    }));

    app.post('/integration/service/raft', asyncMiddleware(async (req, res, next) => {
        logger.info('Raft integration service request: ', req.body);
        try {
            res.json(await integrationService.integrateOrderer(ordererFromHttpBody(req.body)))
        } catch (e) {
            logger.error(e);
            res.status(401).json(e);
        }
    }));

}


function orgFromHttpBody(body) {//TODO: move to model
    let org = {orgId: body.orgId, domain: body.domain || cfg.domain, orgIp: body.orgIp, peer0Port: body.peerPort, wwwPort: body.wwwPort};
    logger.info('Org: ', org);

    return org;
}

function ordererFromHttpBody(body) {//TODO: move to model
    let orderer = {
        ordererName: body.ordererName, domain: body.domain, ordererPort: body.ordererPort,
        ordererIp: body.ordererIp, wwwPort: body.wwwPort, orgId: body.orgId, orgIp: body.ordererIp
    };
    logger.info('Orderer: ', orderer);
    return orderer;
}