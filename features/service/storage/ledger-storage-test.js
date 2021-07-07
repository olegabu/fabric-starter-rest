const fs = require('fs-extra')
const assert = require('assert')
const _ = require('lodash')
const {Given, When, Then,} = require('cucumber');
const cfg = require('../../../config.js');
const streamUtils = require('../../../util/stream/streams')

const FabricStarterClient = require('../../../fabric-starter-client')
const LedgerStorage = require('../../../service/storage/ledger-storage')


let fabricStarterClient


Given('No package with id {string} present', {timeout: 30 * 1000}, async function (chaincodeId) {
    fabricStarterClient = new FabricStarterClient();
    await fabricStarterClient.init();
    await fabricStarterClient.loginOrRegister('admin', cfg.enrollSecret);
    await fabricStarterClient.invoke('common', 'dns', 'put', ['chaincodes', '{}'], null, true)
    return 'success';
});


When('User invokes POST \\/storage\\/chaincodes with params chaincodeId={string}, version="{string}", upload package payload', async function (chaincodeId, version) {
    this.storageService = new LedgerStorage(fabricStarterClient, cfg.DNS_CHANNEL, cfg.DNS_CHAINCODE, 'chaincodes')
    await this.storageService.store(chaincodeId, {version: '1'}, streamUtils.stringToStream('test-string'))
    return 'success';
});

Then('subkey {string} should appear in ledger object, and contain object like \\{version=1, package:base64data}', async function (chaincodeId) {
    const chaincodesAnswer = await fabricStarterClient.query(cfg.DNS_CHANNEL, cfg.DNS_CHAINCODE, 'get', '["chaincodes"]');
    const actualChaincodes = JSON.parse(chaincodesAnswer)
    assert.deepStrictEqual(actualChaincodes, {
        [chaincodeId]: {
            version: '1',
            payload: Buffer.from('test-string').toString('base64')
        }
    }, 'Chaincodes are read from ledger')
    return 'success';
});


Then('the list of chaincodes is returned without payload and contains {string}', async function (chaincodeId) {
    const chaincodesList = await this.storageService.getChaincodesList()
    assert.deepStrictEqual(chaincodesList[0], {chaincodeId: chaincodeId, version: '1'}, 'Chaincode list contains chaincode data without payload')
    return 'success';
});


