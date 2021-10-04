const fs = require('fs-extra');
const _ = require('lodash');

class ChaincodeService {
    constructor(fabricStarterRuntime) {
        this.fabricStarterRuntime = fabricStarterRuntime
    }

    async getInstalledChaincodes() {
        const chaincodes = await this.fabricStarterRuntime.getFabricVersionAdapter().getInstalledChaincodes();
        return chaincodes
    }


    async getInstantiatedChaincodes(channelId, chaincodeName = null) {
        const chaincodes = await this.getCommittedChaincodes(channelId, chaincodeName);
        return {"chaincodes": chaincodes}
    }

    async getCommittedChaincodes(channelId, chaincodeName = null) {
        let chaincodes = await this.fabricStarterRuntime.getFabricVersionAdapter().getInstantiatedChaincodes(channelId);
        if (chaincodeName)
            chaincodes = _.filter(chaincodes, chaincode => _.isEqual(chaincodeName, _.get(chaincode, 'name')))
        return chaincodes;
    }

    async installChaincode(chaincodeId, metadata = {}, fileName, opts) {
        return await this.installChaincodeFromStream(chaincodeId, metadata.version, fs.createReadStream(fileName), opts)
    }

    async installChaincodeFromStream(chaincodeId, metadata = {}, stream, opts) {
        return await this._getFabricVersionAdapter().installChaincode(chaincodeId, metadata, stream, opts)
    }

    async installChaincodeAsExternalService(chaincodeId, metadata, opts) {
        return this._getFabricVersionAdapter().installChaincodeAsExternalService(chaincodeId, metadata.version)
    }

    async runExternalChaincode(chaincodeId, metadata = {packageId: ''}, opts) {
        return this._getFabricVersionAdapter().runExternalChaincode(chaincodeId, metadata.packageId)
    }

    async approveChaincode(channel, chaincodeId, version, packageId, isInitRequired) {
        return this._getFabricVersionAdapter().approveChaincode(channel, chaincodeId, version, packageId, isInitRequired)
    }

    async commitChaincode(channel, chaincodeId, version, sequence) {
        return this._getFabricVersionAdapter().commitChaincode(channel, chaincodeId, version, sequence)
    }

    async instantiateChaincode(channel, chaincodeId, version, packageId, isInitRequired) {
        const approval = await this.approveChaincode(channel, chaincodeId, version, packageId, isInitRequired);
        const currentlyInstantiated = _.find(await this.getCommittedChaincodes(channel, chaincodeId), ch=>_.isEqual(version, _.get(ch, 'version')))
        if (!currentlyInstantiated || !_.isEqual(approval.sequence, _.get(currentlyInstantiated, 'sequence'))) {
            await this.commitChaincode(channel, chaincodeId, version, approval.sequence)
        }
    }

    _getFabricVersionAdapter() {
        return this.fabricStarterRuntime.getFabricVersionAdapter();
    }

}

module.exports = ChaincodeService