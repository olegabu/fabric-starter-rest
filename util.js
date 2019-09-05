const fs = require('fs');
const _ = require('lodash');
const cfg = require('./config.js');
const logger =  cfg.log4js.getLogger('RestSocketServer');

class Util {

    async retryOperation(nTimes, fn) {
        return new Promise((resolve, reject) => {
            if (nTimes <= 0) return reject('Retried invocation unsuccessful');
            try {
                let response = fn();
                resolve(response);
            } catch (err) {
                logger.trace(`Error: `, err, `\nRe-trying invocation: ${nTimes}.`);
                setTimeout(() => {
                    this.retryOperation(--nTimes, resolve, reject, fn)
                }, cfg.CHANNEL_LISTENER_UPDATE_TIMEOUT);
            }
        });
    }

    loadPemFromFile(pemFilePath) {
        let certData = fs.readFileSync(pemFilePath);
        return Buffer.from(certData).toString()
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new Util();
