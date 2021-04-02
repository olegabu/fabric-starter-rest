const _ = require('lodash');
const cfg = require('$/config.js');
const logger = cfg.log4js.getLogger('Bootstrap');

class Bootstrap {

    static fromHttpBody(body) {
        if (typeof body === 'string') {
            body= JSON.parse(body)
        }
        let obj = {
            ip: _.get(body, 'bootstrapIp', _.get(body, 'BOOTSTRAP_IP')),
            remoteOrdererDomain: _.get(body,'remoteOrdererDomain', _.get(body, 'REMOTE_ORDERER_DOMAIN'))
        };
        logger.debug("Bootstrap from http", obj)
        return obj
    }
}

module.exports = Bootstrap;
