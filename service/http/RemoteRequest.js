const _ = require('lodash')
const httpService = require('./http-service')
const cfg = require('../../config.js');
const Org = require("../../model/Org");
const logger = cfg.log4js.getLogger('RemoteRequest');

class RemoteRequest {

    async requestRemoteComponentDeployment(org, component) {

        const remoteHost = getRequired(component, 'componentIp')
        const remotePort = _.get(component, 'externalPort', 443)
        const remoteProtocol = _.get(component, 'communicationProtocol', 'https')

        const remoteOrg = Org.fromOrg(org, {orgIp: remoteHost})
        const componentValues = {values: _.get(component, 'values')}
        const files = _.get(component, 'files');

        const url = `${remoteProtocol}://${remoteHost}:${remotePort}/node/components`;
        logger.debug('RemoteRequest to', url)
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

module.exports = new RemoteRequest()