const axios = require('axios');
const _ = require('lodash');
const https = require("https");
const logger = require('../../util/log/log4js-configured').getLogger('HttpService')
const FormDataFactory = require('./FormDataFactory');
const streamUtils = require('../../util/stream/streams');

function withTimeout(opts, timeout) {
    return {timeout: timeout, ...opts,}
}

class HttpService {

    constructor() {
        this.agent = new AxiosAgent()
    }

    async get(url, opts) {
        return await this.agent.get(url, opts);
        // response = this.extractResponse(response);
/*        logger.debug(`Http. Get request:${url}`, '\nResponse status:', response.status)

        let data = response.data;
        if (response.headers['transfer-encoding'] === 'chunked' && data && data.indexOf('data:') !== -1) {
            data = _.trim(data.substring('data:'.length))
            try {
                return JSON.parse(data)
            } catch (e) {
                logger.debug("Chunked answer is not JSON:", response);
                return {}
            }
        }
        return data*/
    }

    async post(url, formData, opts) {
        let result = await this.agent.post(url, formData, opts);
        logger.debug(`Http. Post request:${url}`, formData || {}, '\nResponse:', _.get(result, "status"))
        return result
    }

    async postMultipartStream(url, fields, fileFieldName, fileName, fileStream, opts) {
        const files = [{
            fieldname: fileFieldName,
            filename: fileName,
            // path: path.join(__dirname, '../../../fixtures/msp_org1.example.test.tgz')
            stream: fileStream
        }]
        return await this.postMultipart(url, fields, files, opts)
    }

    async postMultipart(url, fields, files, opts) {
        logger.debug(`postMultipart. Request:${url}`, fields || {}, _.map(files, f => f.fieldname))
        // let response = await this.agent.postMultipart(url, fields, files, withTimeout(opts, cfg.CHAINCODE_PROCESSING_TIMEOUT));
        let response = await this.agent.postMultipart(url, fields, files, opts);
        logger.debug('postMultipart. Response:', _.get(response, 'status'))
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
        return await this.post(url, formData, {...opts, headers: formDataHeaders})
    }


    /**
     * Get requets. See post() for __opts__ options
     * @param url
     * @param opts
     * @returns {Promise<*>}
     */

    async get(url, opts) {
        return await this.instance.get(url, opts)
            .then(response => parseOrStream(_.get(response, 'data'), opts))
            .catch(async e => await processError(e, opts))

    }

    /**
     * Post request to server
     * @param url
     * @param fields
     * @param files
     * @param opts= {responseType: 'stream'}, for streamed output
     *        opts= {parseStreamedData: true} to parse 'data:{...}' events to array instead of stream
     * @returns {Promise<any>}
     */
    async post(url, data, opts) {
        return await this.instance.post(url, data, opts)
            .then(response => parseOrStream(_.get(response, 'data'), opts))
            .catch(async e => await processError(e, opts))
    }


}

function parseOrStream(responseData, opts) {
    const result = (_.get(opts, 'parseStreamedData') && 'stream' !== _.get(opts, 'responseType'))
        ? parseDataEventsInNoStreamedOutput(responseData)
        : responseData;
    return result;
}

function parseDataEventsInNoStreamedOutput(content) {
    const data = _.reduce(content.split('data:'), (result, item) => {
        item = tryParseJson(item);
        item && result.push(item)
        return result
    }, []);
    return _.size(data)===1 ? _.get(data, '[0]') || data : data;
}

async function processError(e, opts) {
    logger.error(e)
    let answer = _.get(e, 'response.data');
    answer = _.get(opts, 'responseType') === 'stream' ? tryParseJson(await streamUtils.streamToString(answer)) : answer

    throw new Error(_.get(answer, 'message'))
}

function tryParseJson(item) {
    try {
        item = JSON.parse(item)
    } catch (e) {
        logger.debug('Not parseable:', item)
    }
    return item;
}


module.exports = new HttpService()

