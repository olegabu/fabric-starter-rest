const cfg = require('$/config.js');
const logger = cfg.log4js.getLogger('Org');

class Org {

    static fromHttpBody(body) {
        if (typeof body === 'string') {
            body = JSON.parse(body)
        }
        let org = {
            orgId: body.orgId, orgIp: body.orgIp,
            domain: body.domain || cfg.domain,
            peer0Port: body.peerPort || body.peer0Port || cfg.DEFAULT_PEER0PORT,
            wwwPort: body.wwwPort,
            masterIp: body.masterIp,
            peerName: body.peerName
        };
        logger.debug("Org from http", org)
        return org
    }

    static fromConfig(config) {
        let org = {
            orgId: config.org,
            domain: config.domain,
            orgIp: config.myIp,
            peer0Port: cfg.peer0Port,
            peerName: cfg.peerName,
            masterIp: cfg.masterIp,
            bootstrapIp: cfg.bootstrapIp
        };
        logger.debug("Org from config", org)
        return org
    }
}


module.exports = Org;
