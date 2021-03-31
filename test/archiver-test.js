const fs = require('fs');
const _ = require('lodash');
const cfg = require('../config');
const archiverManager = require('../service/archive-manager');


(async function() {
    const promise = await archiverManager.gzip(cfg.ORG_CRYPTO_DIR, '.*\/keystore.*|.*\/sk.pem|.*/\*.key', __dirname + '/example.tgz')

    // const extractTarStream = archiverManager.extractTarTransform(__dirname + '/example.tgz', name=> _.split(name, 'peer0').join('peer10'));

    // await archiverManager.extractStream(extractTarStream, '.tgz', __dirname+'/ttt')

   await archiverManager.extract(__dirname + '/example.tgz', '/example.tgz', __dirname+'/ttt')
})()




