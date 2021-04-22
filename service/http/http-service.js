const fs = require('fs');
const FormData = require('form-data');
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
        logger.debug(`Http. Request:${url}`, data, '\nResponse:', this.extractResponse(response))
        return response.data
    }

    async postMultipart(url, values, files, opts) {
        logger.debug(`postMultipart. Request:${url}`, values, files)
        let response = await this.agent.postMultipart(url, values, files, opts);
        logger.debug('postMultipart. Response:', this.extractResponse(response))
        return response.data
    }

    async download(url, targetFile) {
        this.agent.get(url).pipe(targetFile)
    }

    extractResponse(response) {
        return response && (response.config || response.response || response);
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

    async get(url, opts) {
        return await this.instance.get(url, opts)
    }

    async post(url, data, opts) {
        return await this.instance.post(url, data, opts)
    }

    async postMultipart(url, values, files, opts) {

        const formData = new FormData();
        _.each(values, (val, key) => {
            formData.append(key, val);
        })
        _.each(files, f => {
            try {
                formData.append(f.fieldname, fs.createReadStream(f.path, {encoding: 'binary'}));
            } catch (e) {
                logger.debug("Can't attach file to multipart: ", f)
            }
        })

        return await this.instance.post(url, formData, _.assign({}, opts, {headers: formData.getHeaders()}))
    }


}

module.exports = new HttpService()

