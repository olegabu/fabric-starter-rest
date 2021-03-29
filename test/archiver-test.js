const fs = require('fs');
const cfg = require('../config');
const archiverManager = require('../service/archive-manager');



archiverManager.gzip(cfg.ORG_CRYPTO_DIR, '.*\/keystore|.*\/sk.pem|.*/\*.key', __dirname + '/example.zip')




