const _ = require('lodash')
const httpService = require('../http/http-service')
const cfg = require('../../config.js');
const Org = require("../../model/Org");
const logger = cfg.log4js.getLogger('RemoteComponentRequest');

class RemoteComponentRequest {

    async requestRemoteComponentDeployment(org, component) {

        const remoteHost = getRequired(component, 'componentIp')
        const remotePort = _.get(component, 'externalPort', cfg.BOOTSTRAP_EXTERNAL_PORT)
        const remoteProtocol = _.get(component, 'communicationProtocol', cfg.BOOTSTRAP_SERVICE_URL) //todo: implement in component

        const remoteOrg = Org.fromOrg(org, {orgIp: remoteHost})
        const componentValues = {values: _.get(component, 'values')}
        const files = _.get(component, 'files');

        const url = `${remoteProtocol}://${remoteHost}:${remotePort}/node/components`;
        logger.debug('Remote request to', url)
        return await httpService.postMultipart(url, {org: remoteOrg, components: [componentValues]}, files)
    }
}

getRequired = (object, prop) => {
    const result = _.get(object, prop)
    if (!result) {
        throw new Error(`Property ${prop} is not specified`)
    }
    return result
}

module.exports = new RemoteComponentRequest()