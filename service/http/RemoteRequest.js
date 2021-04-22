const _ = require('lodash')
const httpService = require('./http-service')
const cfg = require('$/config.js');
const logger = cfg.log4js.getLogger('RemoteRequest');

class RemoteRequest {

    async deployComponent(org, component) {

        /*
                http.request({
                    hostname: _.get(component, 'componentIp'),
                    port: _.get(component, 'externalPort', 443),
                    path: '/node/components',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
        */
        const remoteHost = _.get(component, 'componentIp')
        const remotePort = _.get(component, 'externalPort', 443)

        logger.debug('RemoteRequest to', `https://${remoteHost}:${remotePort}/node/components`)
        return await httpService.postMultipart(`https://${remoteHost}:${remotePort}/node/components`, _.get(component, 'values'), _.get(component, 'files'))
    }
}

module.exports = new RemoteRequest()