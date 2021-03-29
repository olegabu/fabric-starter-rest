const cfg = require('$/config');
const archiverManager = require('$/service/archive-manager');

class MspManager {
    packOrgPeerMsp() {
        return archiverManager.gzip(cfg.ORG_CRYPTO_DIR, '.*\/keystore|.*\/sk.pem|.*/\*.key')
    }
}

module.exports=new MspManager()