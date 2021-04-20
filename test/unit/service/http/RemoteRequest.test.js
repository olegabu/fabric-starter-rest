const request = require('supertest')
const express = require('express');
const nodeComponentsApi=require("../../../../api/node-components-management-api")
const NodeComponentsManager=require("../../../../service/nodecomponents/node-components-manager")
const remoteRequest=require("../../../../service/http/RemoteRequest")


const app=express()
app.use(bodyParser.json({limit: '100MB', type: 'application/json'}));
app.use(bodyParser.urlencoded({extended: true, limit: '100MB'}));
const managerMock = jest.fn(new NodeComponentsManager())
nodeComponentsApi(app, managerMock)


test('start remote component request', async () =>{

    await remoteRequest.startComponent({targetIp:'x.x.x.x', componentName:'peer0.org1.example.com', componentType:'PEER'})
    expect(managerMock.mock.calls.length).toBeGreaterThan(0)
})
