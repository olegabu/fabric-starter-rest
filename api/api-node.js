const nodeManager = require('$/service/node-manager')

module.exports = async function (app, server) {

    app.get('/node/config', (req, res) => {

    })


    app.post('/node/control', async (req, res) => {
        res.json(await nodeManager.startupNode(req.body))
    })
}