const path = require('path')
const assert = require('assert')
const _ = require('lodash')
const {Given, When, Then,} = require('cucumber');

const testEnv = require('dotenv').config({path: path.join(__dirname, 'env')}) //set process env from predefined env; should be set before requiring config.js
const cfg = require('../../../../config.js');
const streamUtils = require('../../../../util/stream/streams')

const FabricStarterClient = require('../../../../fabric-starter-client')
const LedgerStorage = require('../../../../service/storage/ledger-storage')
const archiveManager = require('../../../../service/archive-manager')


let fabricStarterClient
const starterRuntimeMock = {getDefaultFabricStarterClient: () => fabricStarterClient}


Given('Empty chaincode storage', {timeout: 30 * 1000}, async function () {
    fabricStarterClient = new FabricStarterClient();
    await fabricStarterClient.init();
    await fabricStarterClient.loginOrRegister('admin', cfg.enrollSecret);
    await fabricStarterClient.invoke('common', 'dns', 'put', ['chaincodes', '{}'], null, true)
    return 'success';
});

     // 'User invokes POST /storage/chaincodes with params chaincodeId="test-chaincode", version="1", upload package payload'
When('User invokes POST \\/storage\\/chaincodes with params chaincodeId={string}, version={string}, upload package payload', async function (chaincodeId, version) {
    this.storageService = new LedgerStorage(starterRuntimeMock, cfg.DNS_CHANNEL, cfg.DNS_CHAINCODE, 'chaincodes')
    const stored = await this.storageService.store(chaincodeId, {version: version}, streamUtils.stringToStream('test-string'))
    assert.strictEqual(stored.status, 'VALID', 'transaction status is not valid')
    return 'success';
});
// Then('subkey {string} should appear in ledger object, and contain object like \{version="{int}", package=base64data}',
Then('subkey {string} should appear in ledger object, and contain object like [version={string}, package=base64data]', async function (chaincodeId, version) {
    const chaincodesAnswer = await fabricStarterClient.query(cfg.DNS_CHANNEL, cfg.DNS_CHAINCODE, 'get', '["chaincodes"]');
    const actualChaincodes = JSON.parse(chaincodesAnswer)
    assert.deepStrictEqual(actualChaincodes, {
        [chaincodeId]: {
            version: version,
            payload: Buffer.from('test-string').toString('base64')
        }
    }, 'Chaincodes are read from ledger')
    return 'success';
});


Then('the list of chaincodes is returned without payload and contains {string}', async function (chaincodeId) {
    const chaincodesList = await this.storageService.getChaincodesList()
    assert.deepStrictEqual(chaincodesList[0], {
        chaincodeId: chaincodeId,
        version: '1'
    }, 'Chaincode list contains chaincode data without payload')
    return 'success';
});


When('Save large package to storage', {timeout: 90 * 1000}, async function () {

    this.storageService = new LedgerStorage(starterRuntimeMock, cfg.DNS_CHANNEL, cfg.DNS_CHAINCODE, 'chaincodes')
    const stream = await archiveManager.gzip('./', null, ['lib-fabric-gost.so']);
    const stored = await this.storageService.store("test-chaincode", {archiveType: '.tgz'}, stream);
    assert.strictEqual(stored.status, 'VALID', 'transaction status is not valid')
    return 'success';
});

