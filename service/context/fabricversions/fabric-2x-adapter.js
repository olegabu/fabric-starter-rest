const EventSource = require('eventsource')
const _ = require('lodash');
const cfg = require('../../../config');
const httpService = require('../../http/http-service.js');
const logger = require('../../../util/log/log4js-configured').getLogger('HttpService')

class Fabric2xAdapter {

    constructor() {
    }

    async getInstantiatedChaincodes(channelId) {
        // const chaincodes = await httpService.get(`${cfg.SDK_API_URL}/lifecycle/channel/${channelId}/chaincodes`)
        return new Promise((resolve, reject) => {
            const res = [];
            const eventSource = new EventSource(`http://${cfg.SDK_API_URL}/lifecycle/channel/${channelId}/chaincodes`);
            eventSource.onmessage = function (event) {
                const chaincode = JSON.parse(event.data);
                logger.debug("New message", chaincode);
                res.push(chaincode)
            };

            eventSource.onerror = function (err) {
                logger.debug("Event Source finished", err);
                try {
                    eventSource.close()
                } catch (e) {
                    logger.error("Error closing event source", e)
                }

                if (typeof err.message !== 'undefined') {
                    return reject(err);
                }

                resolve(res)
            };
        })
    }

    async installChaincode(chaincodeId, metadata, streamOfArchive, opts) {
        //TODO: return await this.fabricStarterRuntime.getDefaultFabricStarterClient()
        //.installChaincode(chaincodeId, chaincodePath, version, language)
    }

    async installChaincodeAsExternalService(chaincodeId, version, opts) {
        // const eventSource = new EventSource(`http://${cfg.SDK_API_URL}/externalchaincode/channel/${channelId}/chaincodes`);
        const sdkHostPort = _.split(cfg.SDK_API_URL, ":");
        const installResult = await httpService.postMultipart(`http://${cfg.SDK_API_URL}/externalchaincode/install/${chaincodeId}/${version}`,
            {host: _.get(sdkHostPort, '[0]'), port: _.get(sdkHostPort, '[1]')})

        return installResult;
    }
}

module.exports = Fabric2xAdapter