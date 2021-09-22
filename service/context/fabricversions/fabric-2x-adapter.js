const EventSource = require('eventsource')
const cfg = require('../../../config');
const httpService = require('../../http/http-service.js');

class Fabric2xAdapter {

    constructor() {
    }

    async getInstantiatedChaincodes(channelId) {
        const eventSource = new EventSource(`${cfg.SDK_API_URL}/lifecycle/channel/${channelId}/chaincodes`);


        // const chaincodes = await httpService.get(`${cfg.SDK_API_URL}/lifecycle/channel/${channelId}/chaincodes`)

        eventSource.onmessage = function (event) {
            console.log("New message", event.data);
            // will log 3 times for the data stream above
        };

        eventSource.addEventListener("end", function (a) {
            console.log("ERORORORORORORO", this);
        })
        eventSource.onerror = function (event, c) {
            console.log("ERORORORORORORO", event);
            // will log 3 times for the data stream above
        };

        eventSource.onopen = function (event) {
            console.log("OPENOPENOPENEOPEN", event);
            // will log 3 times for the data stream above
        };


        return chaincodes
    }

    async installChaincode(chaincodeId, metadata, streamOfArchive, opts) {
        //TODO: return await this.fabricStarterRuntime.getDefaultFabricStarterClient()
        //.installChaincode(chaincodeId, chaincodePath, version, language)
    }

    async installChaincodeAsExternalService(chaincodeId, metadata, streamOfArchive, opts) {
        //TODO: return await this.fabricStarterRuntime.getDefaultFabricStarterClient()
        //.installChaincode(chaincodeId, chaincodePath, version, language)
    }
}

module.exports = Fabric2xAdapter