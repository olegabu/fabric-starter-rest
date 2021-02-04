const nodeManager = require('$/service/node-manager')

module.exports = async function (app, server) {

    app.get('/node/config', (req, res) => {

    })


    app.post('/node/control/start', (req, res) => {
        res.json(nodeManager.startupNode(req.body))
    })
}