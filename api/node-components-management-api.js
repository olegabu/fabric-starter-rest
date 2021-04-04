const os = require('os');
const _ = require('lodash');
const multer = require('multer');
const asyncMiddleware = require('$/api/async-middleware-error-handler');
const mspManager = require('$/service/msp/msp-manager');
const cfg = require('$/config.js');
const Org = require('$/model/Org')
const Enroll = require('$/model/Enroll')
const Bootstrap = require("../model/Bootstrap");
const ModelParser = require("../model/ModelParser");
const Component = require("../model/Component");

const uploadDir = os.tmpdir() || './upload';
const upload = multer({dest: uploadDir});
const fileUpload = upload.any();//fields([{name: 'file', maxCount:4}]); //TODO: any allows any number of files


module.exports = function (app, server, nodeComponentsManager) {

    app.get('/node/config', (req, res) => {
        res.json({org: Org.fromConfig(cfg)})
    })

    app.get('/node/msp', asyncMiddleware(async (req, res) => {
        const packStream = await mspManager.packOrgPeerMsp();
        if (!packStream) {
            throw new Error('Error providing msp')
        }
        res.setHeader('Content-type', 'application/octet-stream')
        res.setHeader('Content-disposition', `attachment; filename="msp_${cfg.org}.tgz"`)
        packStream.pipe(res)
    }))

    app.post('/node/organization', asyncMiddleware(async (req, res, next) => {
        const {org, enroll} = parseOrg(req.body)
        const bootstrap = parseBootstrap(req.body)
        nodeComponentsManager.saveOrgConfig(org, bootstrap, enroll);
        res.status(200).json('');
    }))


    app.post('/node/control', asyncMiddleware(async (req, res, next) => {
        let result = await nodeComponentsManager.startupNode(req.body);
        res.json(result)
    }))

    app.post('/node/control/osn', asyncMiddleware(async (req, res, next) => {
        let result = await nodeComponentsManager.joinNode(req.body);
        res.json(result)
    }))

    app.delete('/node/control', asyncMiddleware(async (req, res) => {
        let result = await nodeComponentsManager.cleanupNode(req.body);
        res.json(result)
    }))

    app.post('/node/components', fileUpload, asyncMiddleware(async (req, res) => {

        // let s = req.files['file'][0].originalname.substring(0, req.files['file'][0].originalname.length - 4);
        // let filePath = req.files['file'][0].path;


        const {org, enroll} = parseOrg(req.body.org)
        const bootstrap = parseBootstrap(req.body.org) //todo: use req.body.bootstrap
        const components = parseTopology(req.body.components, req.files)
        let result = await nodeComponentsManager.deployTopology(org, enroll, bootstrap, components, res);


        // res.json(result)
    }))

    function parseOrg(reqObj) {
        return {
            org: Org.fromHttpBody(reqObj),
            enroll: Enroll.fromHttpBody(reqObj)
        }
    }

    function parseBootstrap(reqObj) {
        return Bootstrap.fromHttpBody(reqObj)
    }

    function parseTopology(reqComponentsArray, files) {
        if (typeof reqComponentsArray === 'string') {
            reqComponentsArray = JSON.parse(reqComponentsArray)
        }
        reqComponentsArray = ModelParser.toJson(reqComponentsArray);

        const components = _.map(reqComponentsArray, cmp=>ModelParser.fromHttp(cmp, Component))
        if (files && files.length) {
            components.forEach(ro => {
                const compFiles = files.filter(f => f.fieldname === 'file_' + _.get(ro,'values.name'))
                ro.files = compFiles;
            })
        }
        return components
    }

}