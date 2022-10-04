const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const tmp = require('tmp-promise');
const archives = require('../../../service/archive-manager');
const logger = require('../../../util/log/log4js-configured').getLogger('Fabric1xAdapter');

const DEFAULT_GO_PATH = '/opt/gopath/src'

class Fabric1xAdapter {

    constructor(fabricStarterRuntime) {
        this.fabricStarterRuntime = fabricStarterRuntime
    }

    async getInstalledChaincodes() {
        return this.fabricStarterRuntime.getDefaultFabricStarterClient().queryInstalledChaincodes();
    }

    async getInstantiatedChaincodes(channelId) {
        return await this.fabricStarterRuntime.getDefaultFabricStarterClient()
            .queryInstantiatedChaincodes(channelId)
    }

    async installChaincode(chaincodeId, metadata, streamOfArchive, opts) {
        logger.debug("Install chaincode from stream: ", chaincodeId, metadata)
        let tmpDir, extractDir;

        try {
            tmpDir = await tmp.dir({dir: opts.tmpRootDir, unsafeCleanup: true})
            extractDir = metadata.language === 'golang' ? opts.gopath || DEFAULT_GO_PATH : tmpDir.path //path.join(tmpDir, 'tmpSubdirIfFlatArchive')
        } catch (e) {
            logger.error(e)
        }

        try {
            await archives.extractStream(streamOfArchive, metadata.archiveType, extractDir)
            /* TODO: allow flat archive as well as archive with directory
                    const files = await fileUtils.readDir(extractDir);
                    if (_.size(files)===1 && files[0].isDirectory()) {
                        fs.move(path.join(extractDir, files[0]), path.join(targetPath, chaincodeId))
                    } else {
                        fs.move(path.join(extractDir), path.join(targetPath, chaincodeId))
                    }
            */

            const chaincodePath = metadata.language === 'golang' ? chaincodeId : path.resolve(extractDir, chaincodeId) //TODO: check if archive misses the subfolder

            const defaultFabricStarterClient = this.fabricStarterRuntime.getDefaultFabricStarterClient();
            const newVar = await defaultFabricStarterClient.installChaincode(chaincodeId, chaincodePath, metadata.version || '1.0', metadata.language);
            return newVar
        } finally {
            await fs.emptyDir(extractDir)
            tmpDir.cleanup && await tmpDir.cleanup()
        }

    }
}

module.exports = Fabric1xAdapter