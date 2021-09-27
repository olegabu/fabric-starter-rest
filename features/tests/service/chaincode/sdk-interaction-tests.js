const fse = require('fs-extra')
const path = require('path')
const assert = require('assert')
const _ = require('lodash')
const request = require('supertest')
const {Given, When, Then,} = require('cucumber');

const app = require('../../../../test/app/test-express-app')
// const app = require('../../../../app')
const Files = require("../../../../model/Files");
const FabricStarterRuntime = require('../../../../service/context/fabric-starter-runtime');
const archiveManager = require('../../../../service/archive-manager')

const ChaincodeService = require('../../../../service/chaincode/chaincode-service')
const Fabric2xAdapter = require('../../../../service/context/fabricversions/fabric-2x-adapter')

const streamUtils = require('../../../../util/stream/streams');

const fabricStarterRuntimeMock = {
    getFabricVersionAdapter: () => new Fabric2xAdapter()
}


Given('Chaincode {string} is instantiated \\(committed) on channel {string}', function (chaincodeName, channelId) {
    // part of test network
    return 'success';
});

When('Client requests list of instantiated chaincodes on channel {string}', async function (channelId) {
    const chaincodeService = new ChaincodeService(fabricStarterRuntimeMock);
    this.instantiatedChaincodes = await chaincodeService.getInstantiatedChaincodes(channelId);

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

When('Client invokes installation of chaincode {string} as external service', async function (chaincodeName) {

    this.installResult = await new Fabric2xAdapter().installChaincodeAsExternalService(chaincodeName, "1.0");

    assert.strictEqual(this.installResult.chaincode.label, chaincodeName + "_1.0")
    assert.ok(/[a-fA-F\d]{64}/.test(this.installResult.chaincode.packageId), "PackageId is hex of 64 char length")

    assert.ok(/.+:\d{4}/.test(this.installResult.chaincodeConnection.address), "Chaincode Address is returned")

    return 'success'
});


Then('Client invokes run external chaincode {string} on remote server', async function (chaincodeName) {
    const sourceDir = './features/fixtures/chaincode/external-chaincode';
    const TEST_PACKAGE_ID = "testId"
    const stream = await archiveManager.gzip(sourceDir);
    const resultStream = await new Fabric2xAdapter().runExternalChaincode(chaincodeName, TEST_PACKAGE_ID, stream);
    const resultOutput = await streamUtils.dataFromEventStream(resultStream);
    assert.ok(new RegExp(`^Emulation of starting chaincode as an external service.*Success\. PORT\: .{4}, PACKAGE_ID: ${TEST_PACKAGE_ID}\\s*$`, "s").test(resultOutput), "Run returns output of executed process")

    return 'success';
});


Then('Run chaincode on the target host {string}', function (targetHost) {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

