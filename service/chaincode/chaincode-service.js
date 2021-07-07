const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const tmp = require('tmp-promise');
const archives = require('../../service/archive-manager');
const fileUtils = require('../../util/fileUtils');


class ChaincodeService {
    constructor(fabricStarterRuntime) {
        this.fabricStarterRuntime = fabricStarterRuntime
    }

    async installChaincode(chaincodeId, metadata = {}, fileName) {
        return this.installChaincodeFromStream(chaincodeId, metadata, fs.createReadStream(fileName))
    }


    async installChaincodeFromStream(chaincodeId, metadata = {}, stream) {
        let tmpDir = await tmp.dir()

        try {
            let extractDir = tmpDir.path //path.join(tmpDir, 'tmpSubdirIfFlatArchive')
            // const targetPath = metadata.language === 'golang' ? '/opt/gopath/src' : tmpDir;

            await archives.extractStream(stream, metadata.archiveType, extractDir)

            /*
                    const files = await fileUtils.readDir(extractDir);
                    if (_.size(files)===1 && files[0].isDirectory()) {
                        fs.move(path.join(extractDir, files[0]), path.join(targetPath, chaincodeId))
                    } else {
                        fs.move(path.join(extractDir), path.join(targetPath, chaincodeId))
                    }
            */


            const chaincodePath = metadata.language === 'golang' ? chaincodeId : path.resolve(extractDir, chaincodeId) //TODO: check if archive skip the subfolder

            await this.fabricStarterRuntime.getDefaultFabricStarterClient()
                .installChaincode(chaincodeId, chaincodePath, metadata.version || '1.0', metadata.language)
        } finally {
            await fs.emptyDir(fs.path)
            tmpDir.cleanup && tmpDir.cleanup()
        }
    }
}

module.exports = ChaincodeService