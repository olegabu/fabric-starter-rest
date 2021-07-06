const fs = require('fs')
const {Base64Encode, Base64Decode} = require('base64-stream')
const cfg = require('../../config');
const logger = cfg.log4js.getLogger('LedgerStorage');
const streamUtils= require('../../util/stream/streams')

class LedgerStorage {

    constructor(fabricStarterClient, channel, chaincode, storageKey) {
        this.fabricStarterClient = fabricStarterClient
        this.channel = channel
        this.chaincode = chaincode
        this.storageKey = storageKey
    }

    storeAsFile(chaincodeId, filePath) {
        return store(chaincodeId, fs.createReadStream(filePath))
    }

    async store(chaincodeId, metadata, stream) {
        const payload = await streamUtils.streamToString(stream.pipe(new Base64Encode()));
        const chaincodes = await this.loadChaincodes();
        chaincodes[chaincodeId] = {...metadata, payload:payload}
        return this.fabricStarterClient.invoke(this.channel, this.chaincode, 'put', [this.storageKey, JSON.stringify(chaincodes)], null, true)
    }

    async loadChaincodes() {
        const chaincodesStr = await fabricStarterClient.query(this.channel, this.chaincode, 'get', JSON.stringify([this.storageKey]));
        let chaincodes = {}
        try {
            chaincodes = JSON.parse(chaincodesStr)
        } catch (e) {
            logger.debug('Chancodes not parseable. Use empty hashMap.')
        }

        return chaincodes
    }
}


module.exports = LedgerStorage