const cfg = require('../../../config');
const httpService = require('../../http/http-service.js');

class Fabric2xAdapter {

    constructor(fabricStarterRuntime) {
        this.fabricStarterRuntime = fabricStarterRuntime
    }

    async getInstantiatedChaincodes(channelId) {
        const chaincodes = await httpService.get(`${cfg.SDK_API_URL}/channels/${channelId}/chaincodes`)
        return chaincodes
    }

    async installChaincode(chaincodeId, metadata, streamOfTarGz, opts) {
        //TODO: return await this.fabricStarterRuntime.getDefaultFabricStarterClient()
            //.installChaincode(chaincodeId, chaincodePath, version, language)
    }
}

module.exports = Fabric2xAdapter