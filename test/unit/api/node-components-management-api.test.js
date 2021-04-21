const _ = require('lodash')
const request = require('supertest')
const express = require('express');
const bodyParser = require('body-parser');

const nodeComponentsApi = require('../../../api/node-components-management-api')

const app = express()
app.use(bodyParser.json({limit: '100MB', type: 'application/json'}));//TODO
app.use(bodyParser.urlencoded({extended: true, limit: '100MB'}));

const NodeComponentsManager = jest.genMockFromModule("../../../service/nodecomponents/node-components-manager")
const componentsManagerMock = new NodeComponentsManager();
nodeComponentsApi(app, null, componentsManagerMock)

const componentValues = {name: 'peer0', peerName: 'peer0', componentType: 'PEER', componentIp: 'x.x.x.x'}

test('component deploy POST', async () => {
    await request(app)
        .post('/node/components')
        .field('components', JSON.stringify([{values: componentValues}]))
        .attach('file_peer0', Buffer.from('test'), 'test.tgz')
        .expect(200)

    const expectedComponent = {
        name: componentValues.name,
        componentType: componentValues.componentType,
        componentIp: componentValues.componentIp,
        values: componentValues,
        files: [expect.objectContaining({
            "fieldname": "file_peer0",
            "originalname": "test.tgz",
        })]
    }

    expect(componentsManagerMock.deployTopology).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything(),
        [expect.objectContaining(expectedComponent)], expect.anything())
})