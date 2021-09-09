const path = require('path')
const assert = require('assert')
const _ = require('lodash')
const {Given, When, Then,} = require('cucumber');

const ChaincodeService = require('../../../../service/chaincode/chaincode-service')


let fabricStarterClient
const starterRuntimeMock = {getDefaultFabricStarterClient: () => fabricStarterClient}


Given('Chaincode {string} is instantiated \\(committed) on channel {string}', function (chaincodeName, channelId) {
    // part of test network
    return 'success';
});

When('Client requests list of instantiated chaincodes on channel {string}', async function (channelId) {
    const chaincodeService = new ChaincodeService(this);
    this.instantiatedChaincodes = await chaincodeService.getInstantiatedChaincodes(channelId);

    return 'success';
});


Then('Chaincode {string} of version {string} is returned', function (chaincodeName, version) {
    assert.deepStrictEqual(this.instantiatedChaincodes, {name: chaincodeName, version: version})
    return 'success';
});




