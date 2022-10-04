const _ = require('lodash');

const cfg = require('../config.js');
const log4jsConfigured = require('../util/log/log4js-configured');
const logger = log4jsConfigured.getLogger('model.Org');

class Org {

    static fromHttpBody(body) {
        if (typeof body === 'string') {
            body = JSON.parse(body)
        }
        let org = {
            orgId: _.get(body, 'orgId'),
            orgIp: _.get(body, 'orgIp'),
            masterIp: _.get(body, 'masterIp'),
            ordererIp: _.get(body, 'ordererIp'),
            domain: _.get(body, 'domain', cfg.domain),
            peer0Port: _.get(body, 'peerPort', _.get(body, 'peer0Port')) || cfg.DEFAULT_PEER0PORT,
            wwwPort: _.get(body, 'wwwPort'),
            peerName: _.get(body, 'peerName')
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
            bootstrapIp: cfg.bootstrapIp,
            ordererIp: cfg.ordererIp
        };
        logger.debug("Org from config", org)
        return org
    }

    static fromOrg(orgObj, updateProps) {
        let org = _.assign({}, orgObj, updateProps)
        logger.debug("Org from other another Org", org)
        return org
    }
}


module.exports = Org;
