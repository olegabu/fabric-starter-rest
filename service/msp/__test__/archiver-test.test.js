const fs = require('fs-extra');
const _ = require('lodash');
const cfg = require('../../../config');
const archiverManager = require('../../../service/archive-manager');
const mspManager = require('../../../service/msp/msp-manager');


test('Test MSP archive', async () => {
    const testMspDir = __dirname + 'test-msp';
    fs.emptyDirSync(testMspDir);

    const stream = await mspManager.packOrgPeerMsp()
    // const promise = await archiverManager.gzip(cfg.ORG_CRYPTO_DIR, '.*\/keystore.*|.*\/sk.pem|.*/\*.key', __dirname + '/example.tgz')
    // const extractTarStream = archiverManager.extractTarTransform(__dirname + '/example.tgz', name=> _.split(name, 'peer0').join('peer10'));
    // await archiverManager.extractStream(extractTarStream, '.tgz', __dirname+'/ttt')
    await archiverManager.extractStream(stream, '.tgz', testMspDir)
})




