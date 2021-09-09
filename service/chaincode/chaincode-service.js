const fs = require('fs-extra');

class ChaincodeService {
    constructor(fabricStarterRuntime) {
        this.fabricStarterRuntime = fabricStarterRuntime
    }

    async getInstantiatedChaincodes(channelId) {
        return await this.fabricStarterRuntime.getFabricVersionAdapter().getInstantiatedChaincodes(channelId)
    }

    async installChaincode(chaincodeId, metadata = {}, fileName, opts) {
        return await this.installChaincodeFromStream(chaincodeId, metadata, fs.createReadStream(fileName), opts)
    }

    async installChaincodeFromStream(chaincodeId, metadata = {}, stream, opts) {
      return await this.fabricStarterRuntime.getFabricVersionAdapter()
          .installChaincode(chaincodeId, metadata, stream, opts)
    }
}

module.exports = ChaincodeService