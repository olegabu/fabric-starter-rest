const fs = require('fs');
const net = require('net');
const _ = require('lodash');
const cfg = require('./config.js');
const logger = cfg.log4js.getLogger('util');

class Util {

    async checkRemotePort(server, port) {
        logger.debug(`Check remote port is accessible for: ${server}:${port}`);
        return new Promise(async (resolve, reject) => {
            let client = net.createConnection({host: server, port: port, timeout: 1000}, ()=>{
                logger.debug(`Remote port is accessible: ${server}:${port}`);
                client.end();
                resolve();
            });
            client.on("error", e => {
                reject(`Endpoint is unreachable: ${server}:${port}. ${e && e.message}`)
            });
        });
    }

    async retryOperation(nTimes, fn) {
        return new Promise(async (resolve, reject) => {
            if (nTimes <= 0) return reject('Retried invocation unsuccessful');
            try {
                let response = await fn();
                resolve(response);
            } catch (err) {
                logger.trace(`Retry attempt: ${nTimes}. Error: `, err);
                await this.sleep(cfg.CHANNEL_LISTENER_UPDATE_TIMEOUT);
                return this.retryOperation(--nTimes, fn);
            }
        });
    }

    filterOrderersOut(organizations) {
        let ordererNames = [cfg.HARDCODED_ORDERER_NAME, `${cfg.HARDCODED_ORDERER_NAME}.${cfg.ORDERER_DOMAIN}`, `${cfg.ordererName}.${cfg.ORDERER_DOMAIN}`];
        const differenceWith = _.differenceWith(organizations, ordererNames, (org, rejectOrg) => org.id === rejectOrg);
        return _.filter(organizations,
                o=> !_.includes(_.get(o,'id'), 'orderer')
                              && !_.includes(_.get(o,'id'), 'osn')
                              && !_.includes(_.get(o,'id'), 'raft'));
    }

    loadPemFromFile(pemFilePath) {
        let certData = fs.readFileSync(pemFilePath);
        return Buffer.from(certData).toString()
    }

    async sleep(ms) {
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

    writeFile(file, keyValueHostRecords) {
        if (this.existsAndIsFile(file)) {
            try {
                const currHostsLines = fs.readFileSync(file, 'utf-8').split('\n');
                const currHosts = this.linesToKeyValueList(currHostsLines);

                let newHostsMap = this.mergeKeyValueLists(currHosts, keyValueHostRecords);

                let hostsFileContent = `# replaced by writeFile  \n`;
                _.forOwn(newHostsMap, (value, key) => {
                    hostsFileContent = hostsFileContent + key + ' ' + value + '\n';
                });

                fs.writeFileSync(file, hostsFileContent);

                logger.info(`written: ${file}\n`, hostsFileContent);
            } catch (err) {
                logger.error(`cannot writeFile ${file}`, err);
            }
        } else {
            logger.debug(`Skipping ${file}`);
        }
    }


    existsAndIsFile(file) {
        try {
            fs.accessSync(file, fs.constants.W_OK);
            return fs.statSync(file).isFile()
        } catch (e) {
            logger.debug(`Cannot open file ${file}`, e);
        }
    }


}

module.exports = new Util();
