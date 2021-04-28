const _ = require('lodash')
const request = require('supertest')
const express = require('express');
const bodyParser = require('body-parser');

const nodeComponentsApi = require('../node-components-management-api')
const Files = require("../../model/Files");

const app = express()
app.use(bodyParser.json({limit: '100MB', type: 'application/json'}));//TODO
app.use(bodyParser.urlencoded({extended: true, limit: '100MB'}));

const NodeComponentsManager = jest.genMockFromModule("../../service/nodecomponents/node-components-manager")
const componentsManagerMock = new NodeComponentsManager();
nodeComponentsApi(app, null, componentsManagerMock)

const componentValues = {name: 'peer0', peerName: 'peer0', componentType: 'PEER', componentIp: 'x.x.x.x'}
const expectedComponent = {
    name: componentValues.name,
    componentType: componentValues.componentType,
    componentIp: componentValues.componentIp,
    values: componentValues,
    files: [expect.objectContaining({
        "fieldname": Files.componentFileName("peer0"),
        "originalname": "test.tgz",
    })]
}


test('component deploy POST', async () => {
    await request(app)
        .post('/node/components')
        .field('components', JSON.stringify([{values: componentValues}]))
        .attach(Files.componentFileName('peer0'), Buffer.from('test'), 'test.tgz')
        .expect(200)

    expect(componentsManagerMock.deployTopology).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything(),
        [expect.objectContaining(expectedComponent)], expect.anything())
})


test.skip('component deploy should allow CORS', async () => {
    await request(app)
        .options('/node/components')
        .retry(0)
        .then((res) => {
            expect(res.headers['Access-Control-Allow-Origin']).toEqual(expect.anything())
        })

})