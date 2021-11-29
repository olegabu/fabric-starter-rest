const os = require('os');
const _ = require('lodash');
const multer = require('multer');
const asyncMiddleware = require('../api/async-middleware-error-handler');
const log4jsConfigured = require('../util/log/log4js-configured');
const logger = log4jsConfigured.getLogger('IntegrationApi');
const Org = require('../model/Org')

const uploadDir = os.tmpdir() || './upload';
const upload = multer({dest: uploadDir});
const certificatesUpload = upload.fields([{name: 'certFiles', maxCount: 1}]); //TODO: refactor upload duplicates


module.exports = function (app, server, integrationService) {

    app.post('/service/accept/orgs', asyncMiddleware(async (req, res) => {
        res.json(integrationService.acceptOrg(req.body))
    }));

    app.get('/service/accepted/orgs', asyncMiddleware((req, res) => {
        res.json(integrationService.acceptedOrgsList());
    }));

    app.get('/integration/service/accepted/orgs', asyncMiddleware((req, res) => {//todo: unauthorized!!!!
        res.json(integrationService.acceptedOrgsList());
    }));

    app.post('/integration/service/orgs', certificatesUpload, asyncMiddleware(async (req, res) => {
        logger.info('Org integration service request: ', req.body);
        try {
            res.json(await integrationService.integrateOrg(Org.fromHttpBody(req.body), _.get(req, 'files.certFiles')))
        } catch (e) {
            logger.error(e);
            res.status(401).json(e);
        }
    }));

    app.post('/integration/dns/org', asyncMiddleware(async (req, res) => {
        logger.info('Dns integration service request: ', req.body);
        try {
            res.json(await integrationService.registerOrgInDns(Org.fromHttpBody({...req.body})))
        } catch (e) {
            logger.error(e);
            res.status(401).json(e);
        }
    }));

    app.post('/integration/service/raft', certificatesUpload, asyncMiddleware(async (req, res, next) => {
        logger.info('Raft integration service request: ', req.body);
        try {
            let stream = await integrationService.integrateOrderer(ordererFromHttpBody(req.body), _.get(req, 'files.certFiles'));
            logger.info('Streaming updated config block back to new organization node')
            stream.on('error', (err) => {
                logger.debug('Error streaming ', err);
                res.status(500).json(err)
            });
            res.on('error', (err) => {
                logger.debug('Error streaming ', err);
                res.status(500).json(err)
            });
            res.set('Content-Type', 'application/octet-stream');
            stream.pipe(res)
        } catch (e) {
            logger.error(e);
            res.status(401).json(e);
        }
    }));

}


function ordererFromHttpBody(body) {//TODO: move to model
    let orderer = {
        ordererName: body.ordererName, domain: body.domain, ordererPort: body.ordererPort,
        ordererIp: body.ordererIp, wwwPort: body.wwwPort, orgId: body.orgId, orgIp: body.ordererIp
    };
    logger.info('Orderer: ', orderer);
    return orderer;
}