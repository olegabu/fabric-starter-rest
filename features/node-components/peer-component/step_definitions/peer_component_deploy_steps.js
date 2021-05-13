const path = require('path');
const _ = require('lodash');
const assert = require('assert');
const {Given, When, Then, BeforeAll, AfterAll} = require('cucumber');
const httpService = require('../../../../service/http/http-service');

const org = {
    "orgId": "org1",
    "domain": "example.test",
    "orgIp": "192.168.99.101",
    "masterIp": "192.168.99.101",
    "peer0Port": "17051",
    "peerName": "peer0",
    "bootstrapIp": "",
    "enrollSecret": "adminpw",
}


const peerComponentTopology = {
    "values": {
        "name": "peer2",
        "peerName": "peer2",
        "componentIp": "192.168.99.101",
        "componentType": "PEER",
        "peerPort": "7051",
        "BOOTSTRAP_PEER_NAME": "peer0",
        "BOOTSTRAP_PEER_PORT": "7051"
    },
    "files": {}
}
let app;
BeforeAll(function () {
    app = require('../../../../app')
})

AfterAll(function () {
    app.stopServer()
})

Given('On primary node org is configured with orgIp=primaryIp={string}', function (primaryIp) {
    this.org = _.assign(org, {orgIp: primaryIp, masterIp: primaryIp})
    return 'success';
});


When('User configures topology for component peer {string} and componentIp={string}', function (peerName, componentIp) {
        this.peerComponent = _.assign({}, peerComponentTopology, {
            values: {
                name: peerName,
                peerName: peerName,
                componentIp: componentIp,
                componentType: 'PEER',
                externalPort: process.env.PORT || 4000,
                communicationProtocol: 'http',
                BOOTSTRAP_PEER_PORT: 17051
            }
        })
        return 'success';
    }
);

When('User makes POST \\/node\\/components request to primary node API agent', async function () {

        const response = await httpService.postMultipart('http://localhost:14000/node/components', {org: this.org, components:JSON.stringify([this.peerComponent])})
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


