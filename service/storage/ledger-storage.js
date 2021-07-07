const fs = require('fs')
const _ = require('lodash')
const {Base64Encode, Base64Decode} = require('base64-stream')
const cfg = require('../../config');
const logger = cfg.log4js.getLogger('LedgerStorage');
const streamUtils= require('../../util/stream/streams')

const PAYLOAD_PROP='payload'

class LedgerStorage {

    constructor(fabricStarterClient, channel, chaincode, storageKey) {
        this.fabricStarterClient = fabricStarterClient
        this.channel = channel
        this.chaincode = chaincode
        this.storageKey = storageKey
    }

    storeAsFile(chaincodeId, metadata, filePath) {
        return this.store(chaincodeId, fs.createReadStream(filePath))
    }

    async store(chaincodeId, metadata, stream) {
        const payload = await streamUtils.streamToString(stream.pipe(new Base64Encode()));
        const chaincodes = await this._loadChaincodesData();
        chaincodes[chaincodeId] = {...metadata, [PAYLOAD_PROP]:payload}
        return this.fabricStarterClient.invoke(this.channel, this.chaincode, 'put', [this.storageKey, JSON.stringify(chaincodes)], null, true)
    }

    async getChaincodesList() {
        const chaincodeData = await this._loadChaincodesData();
        return _.map(chaincodeData, (val, key) => {
            delete val[PAYLOAD_PROP]
            return {
                    chaincodeId: key,
                    ...val
                }
        })
    }

    async _loadChaincodesData() {
        const chaincodesStr = await this.fabricStarterClient.query(this.channel, this.chaincode, 'get', JSON.stringify([this.storageKey]));
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