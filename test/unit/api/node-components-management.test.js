const request = require('supertest')
const express = require('express');
const bodyParser = require("body-parser");
const nodeComponentsApi = require('../../../api/node-components-management-api')
const NodeComponentsManager = require("../../../service/nodecomponents/node-components-manager")

const app = express()
app.use(bodyParser.json({limit: '100MB', type: 'application/json'}));//TODO
app.use(bodyParser.urlencoded({extended: true, limit: '100MB'}));

const managerMock = jest.fn().mockImplementation(() => {
    return {deployTopology: jest.fn()}
})
nodeComponentsApi(app, null, managerMock())


test('component deploy POST', async () => {
    await request(app)
        .post('/node/components')
        .send('Content-Type', 'application/json')
        .send({})
        .expect(200)

    expect(managerMock.call.length).toBeGreaterThan(0)
})