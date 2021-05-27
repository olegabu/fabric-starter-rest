const path = require('path');
const _ = require('lodash');
const assert = require('assert');
const NodeComponentsManager = require('../../../../service/nodecomponents/node-components-manager');
const {Given, When, Then, BeforeAll, AfterAll} = require('cucumber');
const httpService = require('../../../../service/http/http-service');


let app;
BeforeAll(async function () {
    app = require('../../../../app')
})

AfterAll(function () {
    app.stopServer()
})

Given('On primary node org is configured with orgIp=primaryIp={string}', function (primaryIp) {
    this.org = {
        "orgId": "org1",
        "domain": "example.test",
        "orgIp": primaryIp,
        "masterIp": primaryIp,
        "peer0Port": "17051",
        "peerName": "peer0",
        "enrollSecret": "adminpw",
        "ordererIp": '127.0.0.1'
    }
    return 'success';
});


When('User configures topology for component peer {string} and componentIp={string}', function (peerName, componentIp) {
        this.peerComponent = {
            values: {
                name: peerName,
                peerName: peerName,
                componentIp: componentIp,
                componentType: 'PEER',
                externalPort: process.env.PORT || 4000,
                communicationProtocol: 'http',
                peerPort: "7051",
                BOOTSTRAP_PEER_NAME: "peer0",
                BOOTSTRAP_PEER_PORT: 17051
            }
        }
        return 'success';
    }
);

When('User makes POST \\/node\\/components request to primary node API agent', async function () {


        const fields = {
            org: JSON.stringify(this.org),
            components: JSON.stringify([this.peerComponent])
        };
        const response = await httpService.postMultipart('http://localhost:14000/node/components', fields)
        return 'pending';
    }
);

Then('Peer {string} is enrolled to CA', function (string) {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

Then('Peer {string} is enrolled to TLSCA', function (string) {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

Then('DNS record for peer0 and orderer is written in _etc_hosts', function () {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});


Then('Peer {string} is registered in DNS chaincode', function (string) {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

Then('Peer {string} container is started with corresponded ENV', function (string) {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

// unused
When('User provides MSP of org in msp.tar package', function () {
        this.files = [{
            fieldname: 'file_peer2',
            filename: 'msp_org1.example.test.tgz',
            path: path.join(__dirname, '../../../fixtures/msp_org1.example.test.tgz')
        }]
        return 'success';
    }
);


