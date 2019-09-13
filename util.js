const fs = require('fs');
const _ = require('lodash');
const cfg = require('./config.js');
const logger = cfg.log4js.getLogger('RestSocketServer');

class Util {

    async retryOperation(nTimes, fn) {
        return new Promise(async (resolve, reject) => {
            if (nTimes <= 0) return reject('Retried invocation unsuccessful');
            try {
                let response = await fn();
                resolve(response);
            } catch (err) {
                logger.trace(`Error: `, err, `\nRe-trying invocation: ${nTimes}.`);
                this.sleep(cfg.CHANNEL_LISTENER_UPDATE_TIMEOUT);
                return this.retryOperation(--nTimes, fn);
            }
        });
    }

    filterOrderersOut(organizations) {
        let ordererNames = [cfg.HARDCODED_ORDERER_NAME, `${cfg.HARDCODED_ORDERER_NAME}.${cfg.ORDERER_DOMAIN}`, `${cfg.ordererName}.${cfg.ORDERER_DOMAIN}`];
        return _.differenceWith(organizations, ordererNames, (org, rejectOrg) => org.id === rejectOrg);
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
