const path = require('path');
const cfg = require('../../config');
const archiverManager = require('../../service/archive-manager');
const log4jsConfigured = require('../../util/log/log4js-configured');
const logger = log4jsConfigured.getLogger('MspManager');

class MspManager {
    async packOrgPeerMsp() {
        logger.debug("Pack ORG MSP dir ", cfg.ORG_CRYPTO_DIR)
        return await archiverManager.gzip(cfg.ORG_CRYPTO_DIR, cfg.PRIVATE_KEYS_FILTER)
    }

    async packOrdererMsp() {
        logger.debug("Pack Orderer dir ", cfg.ordererCryptoDir)
        return await archiverManager.gzip(cfg.CRYPTO_CONFIG_DIR, cfg.PRIVATE_KEYS_FILTER, path.relative(cfg.CRYPTO_CONFIG_DIR, cfg.ORDERER_TLS_CERT))
    }

    async unpackMsp(tgzPack, targetDir, transformFunc) {
        const extractPath = targetDir || cfg.TMP_DIR;
        logger.debug("Unpack MSP to ", extractPath)
        await archiverManager.extractUploadedArchive(tgzPack, extractPath, transformFunc)
        return extractPath;
    }

    async unpackMspWithPeerNameReplacing(tgzPack, targetDir) {
        return await this.unpackMsp(tgzPack, targetDir, name => _.split(name, 'peer0').join(cfg.peerName)) //TODO: use master peerName
    }

}

module.exports = new MspManager()



/*
    ['peerOrganizations', path.relative(cfg.CRYPTO_CONFIG_DIR, cfg.ORDERER_TLS_CERT)]
    .filter(folder => fs.existsSync(path.join(cfg.CRYPTO_CONFIG_DIR, folder)))
*/
