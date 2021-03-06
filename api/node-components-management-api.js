const asyncMiddleware = require('$/api/async-middleware-error-handler');
const cfg = require('$/config.js');
const Org = require('$/model/Org')
const Enroll = require('$/model/Enroll')


module.exports = async function (app, server, nodeComponentsManager) {

    app.get('/node/config', (req, res) => {
        res.json({org: Org.fromConfig(cfg)})
    })

    app.post('/node/organization', asyncMiddleware(async (req, res, next) => {
        let org = Org.fromHttpBody(req.body);
        let enroll = Enroll.fromHttpBody(req.body);
        cfg.setOrg(org.orgId)
        cfg.setDomain(org.domain)
        cfg.setMyIp(org.orgIp)
        cfg.setEnrollSecret(enroll.enrollSecret)
        res.status(200).json('');
    }))


    app.post('/node/control', asyncMiddleware(async (req, res, next) => {
        let result = await nodeComponentsManager.startupNode(req.body);
        res.json(result)
    }))
}