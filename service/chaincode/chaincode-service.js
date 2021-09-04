const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const tmp = require('tmp-promise');
const archives = require('../../service/archive-manager');
const httpService = require('../http/http-service.js');
const fileUtils = require('../../util/fileUtils');

const DEFAULT_GO_PATH = '/opt/gopath/src'


class ChaincodeService {
    constructor(fabricStarterRuntime) {
        this.fabricStarterRuntime = fabricStarterRuntime
    }

    async installChaincode(chaincodeId, metadata = {}, fileName, opts) {
        return this.installChaincodeFromStream(chaincodeId, metadata, fs.createReadStream(fileName), opts)
    }

    async getInstantiatedChaincode(channelId) {
        httpService.get('/channels')
    }

    async installChaincodeFromStream(chaincodeId, metadata = {}, stream, opts = {tmpRootDir: tmp.tmpdir}) {
        let tmpDir = await tmp.dir({dir: opts.tmpRootDir, unsafeCleanup: true})
        let extractDir = metadata.language === 'golang' ? opts.gopath || DEFAULT_GO_PATH : tmpDir.path //path.join(tmpDir, 'tmpSubdirIfFlatArchive')

        try {
            await archives.extractStream(stream, metadata.archiveType, extractDir)
            /*
                    const files = await fileUtils.readDir(extractDir);
                    if (_.size(files)===1 && files[0].isDirectory()) {
                        fs.move(path.join(extractDir, files[0]), path.join(targetPath, chaincodeId))
                    } else {
                        fs.move(path.join(extractDir), path.join(targetPath, chaincodeId))
                    }
            */

            const chaincodePath = metadata.language === 'golang' ? chaincodeId : path.resolve(extractDir, chaincodeId) //TODO: check if archive misses the subfolder

            await this.fabricStarterRuntime.getDefaultFabricStarterClient()
                .installChaincode(chaincodeId, chaincodePath, metadata.version || '1.0', metadata.language)

        } finally {
            await fs.emptyDir(extractDir)
            tmpDir.cleanup && await tmpDir.cleanup()
        }
        return extractDir
    }
}

module.exports = ChaincodeService