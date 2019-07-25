const logger = require('log4js').getLogger('RestSocketServer');
const _ = require('lodash');
const cfg = require('./config.js');

class UtilityService {

    static async retryOperation(nTimes, fn) {
        return new Promise((resolve, reject) => {
            if (nTimes <= 0) return reject(`Retried invocation unsuccessful`);
            try {
                let response = fn();
                resolve(response);
            } catch (err) {
                logger.trace(`Error: `, err, `\nRe-trying invocation: ${nTimes}.`);
                setTimeout(() => {
                    UtilityService.retryOperation(--nTimes, resolve, reject, fn)
                }, cfg.CHANNEL_LISTENER_UPDATE_TIMEOUT);
            }
        });
    }
}

module.exports = UtilityService;
