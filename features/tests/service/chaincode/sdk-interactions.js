const path = require('path')
const assert = require('assert')
const _ = require('lodash')
const request = require('supertest')
const {Given, When, Then,} = require('cucumber');

const app = require('../../../../test/app/test-express-app')
// const app = require('../../../../app')
const Files = require("../../../../model/Files");
const FabricStarterRuntime = require('../../../../service/context/fabric-starter-runtime');

const ChaincodeService = require('../../../../service/chaincode/chaincode-service')
const Fabric2xAdapter = require('../../../../service/context/fabricversions/fabric-2x-adapter')

const fabricStarterRuntimeMock = {
    getFabricVersionAdapter: () => new Fabric2xAdapter()
}


Given('Chaincode {string} is instantiated \\(committed) on channel {string}', function (chaincodeName, channelId) {
    // part of test network
    return 'success';
});

When('Client requests list of instantiated chaincodes on channel {string}', async function (channelId) {
    const chaincodeService = new ChaincodeService(fabricStarterRuntimeMock);
    const newVar = this.instantiatedChaincodes = await chaincodeService.getInstantiatedChaincodes(channelId);

    return 'success';
});


Then('Chaincode {string} of version {string} is returned', function (chaincodeName, version) {
    assert.deepStrictEqual(this.instantiatedChaincodes, {name: chaincodeName, version: version})
    return 'success';
});


Given('No chaincode {string} is installed', function (chaincodeName) {
    // Write code here that turns the phrase above into concrete actions
    return 'success'; //TODO: remove chaincode
});

When('Web-client requests installation of chaincode {string} as external service', async function (chaincodeName) {

    const installRes = await new Fabric2xAdapter().installChaincodeAsExternalService(chaincodeName, "1.0");

});


Then('Exec install on peer', function () {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});


Then('Run chaincode on the target host {string}', function (targetHost) {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

