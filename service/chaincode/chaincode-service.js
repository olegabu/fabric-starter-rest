const fs = require('fs-extra');

class ChaincodeService {
    constructor(fabricStarterRuntime) {
        this.fabricStarterRuntime = fabricStarterRuntime
    }

    async getInstantiatedChaincodes(channelId) {
        const chaincodes = await this.fabricStarterRuntime.getFabricVersionAdapter().getInstantiatedChaincodes(channelId);
        return {"chaincodes": chaincodes}
    }

    async installChaincode(chaincodeId, metadata = {}, fileName, opts) {
        return await this.installChaincodeFromStream(chaincodeId, metadata, fs.createReadStream(fileName), opts)
    }

    async installChaincodeFromStream(chaincodeId, metadata = {}, stream, opts) {
        return this._getFabricVersionAdapter().installChaincode(chaincodeId, metadata, stream, opts)
    }

    async installChaincodeAsExternalService(chaincodeId, metadata = {}, opts) {
        return this._getFabricVersionAdapter().installChaincodeAsExternalService(chaincodeId, metadata.version)
    }

    async runExternalChaincode(chaincodeId, metadata = {}, opts) {
        return this._getFabricVersionAdapter().runExternalChaincode(chaincodeId, metadata.packageId)
    }


    _getFabricVersionAdapter() {
        return this.fabricStarterRuntime.getFabricVersionAdapter();
    }

}

module.exports = ChaincodeService