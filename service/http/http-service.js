const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const _ = require('lodash');
const cfg = require('../../config.js')
const https = require("https");
const logger = cfg.log4js.getLogger('HttpService')
const FormDataFactory = require('./FormDataFactory');

function withTimeout(opts) {
    return {timeout: cfg.CHAINCODE_PROCESSING_TIMEOUT,  ...opts, }
}

class HttpService {

    constructor() {
        this.agent = new AxiosAgent()
    }

    async post(url, data, opts) {
        let response = await this.agent.post(url, data, opts);
        logger.debug(`Http. Request:${url}`, data, '\nResponse:', this.extractResponse(response))
        return response.data
    }

    async postMultipart(url, fields, files, opts) {
        logger.debug(`postMultipart. Request:${url}`, fields, _.map(files, f => f.fieldname))
        let response = await this.agent.postMultipart(url, fields, files, withTimeout(opts));
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

    async postMultipart(url, fields, files, opts) {
        const {formData, formDataHeaders} = FormDataFactory.createFormData(fields, files)
        opts = {
            ...opts,
            onDownloadProgress: progressEvent => {
                const dataChunk = progressEvent.currentTarget.response;
                // dataChunk contains the data that have been obtained so far (the whole data so far)..
                // So here we do whatever we want with this partial data..
                // In my case I'm storing that on a redux store that is used to
                // render a table, so now, table rows are rendered as soon as
                // they are obtained from the endpoint.
            }
        }
        const response = await this.instance.post(url, formData, _.merge({}, opts, {headers: formDataHeaders, responseType: 'stream'})).catch(e => {
            console.log(e, fields)
            return {}
        });
        return response
    }

}

module.exports = new HttpService()

