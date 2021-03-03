const asyncMiddleware = require('$/api/async-middleware-error-handler');
const nodeManager = require('$/service/node-components-manager')

module.exports = async function (app, server) {

    app.get('/node/config', (req, res) => {

    })


    app.post('/node/control', asyncMiddleware(async(req, res, next) => {
        res.json(await nodeManager.startupNode(req.body))
    }))
}