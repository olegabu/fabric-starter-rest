const cfg = require('../config');
const logger = cfg.log4js.getLogger('asyncMiddleware');

//TODO: refactor ?
// catch promise rejections and return 500 errors

const asyncMiddleware = fn =>
    (req, res, next) => {
        // logger.debug('asyncMiddleware');
        Promise.resolve(fn(req, res, next))
            .catch(e => {
                logger.error('asyncMiddleware', e, req.url, req.params, req.body);
                res.status((e && e.status) || 500).send(e && e.message || e);
                next();
            })
    };

module.exports = asyncMiddleware