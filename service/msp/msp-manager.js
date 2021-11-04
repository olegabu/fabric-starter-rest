const fs = require('fs-extra');
const path = require('path');
const cfg = require('../../config');
const archiverManager = require('../../service/archive-manager');

class MspManager {
    async packOrgPeerMsp() {
        return await archiverManager.gzip(cfg.CRYPTO_CONFIG_DIR, cfg.PRIVATE_KEYS_FILTER,
            ['peerOrganizations', path.relative(cfg.CRYPTO_CONFIG_DIR, cfg.ORDERER_TLS_CERT)]
                .filter(folder => fs.existsSync(path.join(cfg.CRYPTO_CONFIG_DIR, folder)))
        )
    }

    async unpackMsp(tgzPack, targetDir, transformFunc) {
        const extractPath = targetDir || cfg.TMP_DIR;
        await archiverManager.extractUploadedArchive(tgzPack, extractPath, transformFunc)
        return extractPath;
    }

    async unpackMspWithPeerNameReplacing(tgzPack, targetDir) {
        return await this.unpackMsp(tgzPack, targetDir, name => _.split(name, 'peer0').join(cfg.peerName)) //TODO: use master peerName
    }

}

module.exports = new MspManager()