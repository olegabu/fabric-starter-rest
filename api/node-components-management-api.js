const asyncMiddleware = require('$/api/async-middleware-error-handler');
const cfg = require('$/config.js');
const Org = require('$/model/Org')
const Enroll = require('$/model/Enroll')


module.exports = async function (app, server, nodeComponentsManager) {

    app.get('/node/config', (req, res) => {
        res.json({org: Org.fromConfig(cfg)})
    })

    app.post('/node/organization', asyncMiddleware(async (req, res, next) => {
        const {org, enroll} = parseOrg(req.body)
        nodeComponentsManager.setOrgConfig(org, enroll);
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

    app.post('/node/components', asyncMiddleware(async (req, res) => {
        const {org, enroll} = parseOrg(req.body.org)
        const bootstrap = parseBootstrap(req.body.bootstrap)
        const components = parseTopology(req.body.components)
        let result = await nodeComponentsManager.deployTopology(org, enroll, bootstrap, components);
        res.json(result)
    }))

    function parseOrg(reqObj) {
        return {
            org: Org.fromHttpBody(reqObj),
            enroll: Enroll.fromHttpBody(reqObj)
        }
    }

    function parseBootstrap(reqObj) {
        return {

        }
    }

    function parseTopology(reqObj) {
        return reqObj
    }

}