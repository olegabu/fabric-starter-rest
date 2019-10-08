'use strict';

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


    convertStringValToMapVal(keyValueMap) {
        return _.mapValues(keyValueMap, value=>_.keyBy(_.split(value, ' '), v=>v));
    }

    linesToKeyValueList(currHostsLines) {
        let currHosts = _.map(currHostsLines, line => {
            const ipsNames = _.split(_.trim(line), /[ \t]/);
            let key = ipsNames[0];
            let names = ipsNames.slice(1);

            return {[key]: _.join(names, ' ')}
        });
        return _.reduce(currHosts, (result, h) => {
            let key = _.keys(h)[0];
            result[key] = h[key];
            return result;
        }, {});
    }


    mergeKeyValueLists(map1, map2) {
        let hostsMap = this.convertStringValToMapVal(map1);
        let listMap = this.convertStringValToMapVal(map2);

        _.merge(hostsMap, listMap);
        const result = _.mapValues(hostsMap, valKV=>_.join(_.keys(valKV), ' '));
        return result;
    }


}

module.exports = new Util();
