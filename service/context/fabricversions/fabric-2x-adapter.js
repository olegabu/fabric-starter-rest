const EventSource = require('eventsource')
const _ = require('lodash');
const cfg = require('../../../config');
const httpService = require('../../http/http-service.js');
const streamUtils = require('../../../util/stream/streams');
const logger = require('../../../util/log/log4js-configured').getLogger('HttpService')

class Fabric2xAdapter {

    constructor() {
    }

    async getInstalledChaincodes() {
        const installResult = await httpService.get(`http://${cfg.SDK_API_URL}/lifecycle/chaincodes`, {parseStreamedData: true})
        return installResult;
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

    async installChaincode(chaincodeName, metadata, tarGzStream, opts) {
        const installResult = await httpService.postMultipartStream(`http://${cfg.SDK_API_URL}/lifecycle/chaincode/install`, {},
            'packageToRun', `${chaincodeName}.tar.gz`, tarGzStream, opts)
        return await streamUtils.dataFromEventStream(installResult);
    }

    async installChaincodeAsExternalService(chaincodeName, version, opts) {
        // const eventSource = new EventSource(`http://${cfg.SDK_API_URL}/externalchaincode/channel/${channelId}/chaincodes`);
        const sdkHostPort = _.split(cfg.SDK_API_URL, ":");
        const installResult = await httpService.postMultipart(`http://${cfg.SDK_API_URL}/externalchaincode/install/${chaincodeName}/${version}`,
            {agentHost: _.get(sdkHostPort, '[0]'), agentPort: _.get(sdkHostPort, '[1]')})

        let dataObject = await streamUtils.dataFromEventStream(installResult)
        try {
            dataObject = JSON.parse(dataObject)
        } catch (e) {
            logger.error("Install result is not parseable", e)
        }

        return dataObject;
    }

    async runExternalChaincode(chaincodeName, packageId, tarGzStream) {
        if (!tarGzStream) {
            throw new Error("Package to run is required")
        }
        const sdkHostPort = _.split(cfg.SDK_API_URL, ":");
        const result = await httpService.postMultipartStream(`http://${cfg.SDK_API_URL}/externalchaincode/run/${chaincodeName}/${packageId}`,
            {
                agentHost: _.get(sdkHostPort, '[0]'),
                agentPort: _.get(sdkHostPort, '[1]')
            },
            'packageToRun',
            `${chaincodeName}.tar.gz`,
            tarGzStream)
        return result
    }

    async approveChaincode(channel, chaincodeName, version, packageId) {
        const result = await httpService.post(`http://${cfg.SDK_API_URL}/lifecycle/chaincode/approve/${channel}/${chaincodeName}/${version}/${packageId}`)
        return this.convertEventToObject(result);
    }

    async commitChaincode(channel, chaincodeName, version, sequence) {
        const result = await httpService.post(`http://${cfg.SDK_API_URL}/lifecycle/chaincode/commit/${channel}/${chaincodeName}/${version}/${sequence}`)
        return result; //this.convertEventToObject(result);
    }

    convertEventToObject(result) {
        try {
            const eventContent = _.get(_.filter(_.split(result, "data:"), item => !_.isEmpty(item)), 0)
            result = JSON.parse(eventContent)
        } catch (e) {
            logger.error("Answer is unparseable: ", result)
        }
        return result;
    }

}

module.exports = Fabric2xAdapter