const path = require('path');
const axios = require('axios');
const _ = require('lodash');
const cfg = require('$/config.js')
const https = require("https");
const logger = cfg.log4js.getLogger('HttpService')

class HttpService {

    constructor() {
        this.agent = new AxiosAgent()
    }

    async post(url, data, opts) {
        let response = await this.agent.post(url, data, opts);
        logger.debug(`Http. Request:${url}`, data, '\nResponse:', response && (response.config || response.response || response))
        return response.data
    }

    async download(url, targetFile) {
        this.agent.get(url).pipe(targetFile)
    }
}


class AxiosAgent {

    constructor() {
        this.instance = axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });
    }

    async post(url, data, opts) {
        return await this.instance.post(url, data, opts)
    }

    async get(url, opts) {
        return await this.instance.get(url, opts)
    }
}

module.exports = new HttpService()

