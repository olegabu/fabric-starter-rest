const fse = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const assert = require('assert');
const {Given, When, Then, BeforeAll, AfterAll} = require('cucumber');
const httpService = require('../../../../../service/http/http-service');
const util = require('../../../../../util')


Given('Org masterIp \\(peer0) is configured with orgIp=masterIp={string}', function (primaryIp) {
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


When('User creates topology for component peer {string} and componentIp={string}', function (peerName, componentIp) {
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

When('User makes POST \\/node\\/components request to primary peer0 node API agent', {timeout: 500 * 1000}, async function () {

        await util.sleep(3000)
        const fields = {
            org: JSON.stringify(this.org),
            components: JSON.stringify([this.peerComponent])
        };
        const TEST_FILE_NAME = 'post_component_stream.log'
        await fse.remove(TEST_FILE_NAME)
        const response = await httpService.postMultipart('http://localhost:14000/node/components', fields, null, /*{responseType: 'stream'}*/)
        setTimeout(() => {
            if (!response.destroyed) {
                throw new Error('Deployment is not completed in timeout')
            }
        }, 15000)
        response.pipe(fse.createWriteStream(TEST_FILE_NAME))
        setTimeout(async () => {
            if (!await fse.pathExists(TEST_FILE_NAME)) {
                throw new Error('Empty stream output')
            }
        }, 10000)
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


