const x509 = require('x509');
const cfg = require('../config.js');
const logger = cfg.log4js.getLogger('X509Util');

class X509Util {

    decodeCert(cert) {
        return x509.parseCert(cert);
    }

    getSubject(cert) {
        try {
            return x509.getSubject(cert);
        } catch (e) {
            logger.debug("Cannot parse ceficate's Subject", e);
        }
        return {};
    }

}

module.exports = new X509Util();