const cfg = require('$/config.js');
const logger = cfg.log4js.getLogger('Org');

class Org {

    static fromHttpBody(body) {
        let org = {
            orgId: body.orgId, orgIp: body.orgIp,
            domain: body.domain || cfg.domain,
            peer0Port: body.peerPort || cfg.DEFAULT_PEER0PORT,
            wwwPort: body.wwwPort
        };
        logger.debug("Org from http", org)
        return org
    }

    static fromConfig(config) {
        let org = {orgId: config.org, domain: config.domain, orgIp: config.myIp, peer0Port: cfg.peer0Port};
        logger.debug("Org from config", org)
        return org
    }
}


module.exports = Org;
