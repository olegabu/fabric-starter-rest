const os = require('os');
const _ = require('lodash');
const asyncMiddleware = require('../api/async-middleware-error-handler');
const cfg = require('../config');
const logger = cfg.log4js.getLogger('StorageApi');
const Org = require('../model/Org')

const multer = require('multer');
const uploadDir = os.tmpdir() || './upload';
const upload = multer({dest: uploadDir});
const fileUpload = upload.fields([
    {name: 'file', maxCount: 1},
    {name: 'chaincodeId', maxCount: 1},
    {name:'version', maxCount: 1},
    {name:'language', maxCount: 1},
    {name:'archiveType', maxCount: 1},
    ])


module.exports = function (app, server, ledgerStorage) {

    app.get('/storage/chaincodes', asyncMiddleware(async (req, res) => {
        const chaincodes = await ledgerStorage.getChaincodesList();
        return _.map(chaincodes, (val, key) => new Object(
            {
                chaincodeId: key,
                version: _.get(val, 'version'),
                lang: _.get(val, 'language'),
                archiveType: _.get(val, 'archiveType'),
            }
        ))
    }))

    app.post('/storage/chaincodes', fileUpload, asyncMiddleware(async (req, res) => {
        let fileUploadObj = _.get(req, "files.file[0]");
        await ledgerStorage.storeAsFile(req.body.chaincodeId, req.body, fileUploadObj.path
            )
        res.send(req.body)
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