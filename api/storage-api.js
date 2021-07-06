const os = require('os');
const asyncMiddleware = require('../api/async-middleware-error-handler');
const cfg = require('../config');
const logger = cfg.log4js.getLogger('StorageApi');
const Org = require('../model/Org')

const uploadDir = os.tmpdir() || './upload';
const upload = multer({dest: uploadDir});
const fileUpload = upload.any();//fields([{name: 'file', maxCount:4}]); //TODO: any allows any number of files


module.exports = function (app, server, ledgerStorage) {

    app.post('/storage/chaincode', fileUpload, asyncMiddleware(async (req, res) => {
        res.json(integrationService.acceptOrg(req.body))
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