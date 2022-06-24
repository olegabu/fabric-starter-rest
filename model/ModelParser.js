const cfg = require('../config.js');
const logger = cfg.log4js.getLogger('ModelParser');

module.exports = {

    fromHttp(body, Model, ...extra) {
        body = this.toJson(body)
        return Model.fromHttpBody(body, ...extra)
    },

    toJson(body) {
        try {
            if (typeof body === 'string') {
                body = JSON.parse(body)
            }
        } catch (e) {
            logger.error("Body is not parsed from string:", body)
        }
        return body
    }
}