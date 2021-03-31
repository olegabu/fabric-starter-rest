const logger = cfg.log4js.getLogger('Org');

class Bootstrap {

    static fromHttpBody(body) {
        if (typeof body === 'string') {
            body= JSON.parse(body)
        }
        let obj = {
            ip: body.body.bootstrapIp
        };
        logger.debug("Bootstrap from http", obj)
        return obj
    }
}

module.exports = Bootstrap;
