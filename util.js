const fs = require('fs');
const path = require('path');
const net = require('net');
const _ = require('lodash');
const logger = require('./util/log/log4js-configured').getLogger('util')
const cfg = require('./config')

class Util {

    async checkRemotePort(server, port, options = {throws: true}) {
        logger.debug(`Check whether remote port is accessible for: ${server}:${port}`, options);

        return new Promise(async (resolve, reject) => {
            if (!cfg.SKIP_CHECK_PORTS_TIMEOUT_SECONDS) {
                resolveIfTakesLongerThanTimeout(resolve, reject, options);
                let client = net.createConnection({host: server, port: port}, () => {
                    logger.debug(`Remote port is accessible: ${server}:${port}`);
                    client.end();
                    resolve(true);
                });
                client.on("error", e => {
                    logger.debug(`\nError accessing remote port, ${server}:${port}. Throwing: ${options.throws}\n`, e)
                    return options.throws
                        ? reject(`Endpoint is unreachable: ${server}:${port}. ${e && e.message}`)
                        : resolve(false)
                });
            } else {
                logger.warn(`Skip waiting for peer availability. Waited for ${cfg.SKIP_CHECK_PORTS_TIMEOUT_SECONDS} before continue`)
                return resolve(true);
            }
        });

        function resolveIfTakesLongerThanTimeout(resolve, reject, options={}) {
            setTimeout(() => {
                return options.throws ? reject(`Timeout checking remote port: ${server}:${port}`) : resolve(false)
            }, options.timeout || 1000)
        }

    }

    async retryOperation(nTimes, period, fn) {
        return new Promise(async (resolve, reject) => {
            if (nTimes <= 0) return reject('Retried invocation unsuccessful');
            let response = await fn();
            resolve(response);
        }).catch(async err => {
            logger.trace(`Retry attempt: ${nTimes}. Error: `, err);
            if (nTimes === 1) {
                throw new Error(err);
            } else {
                await this.sleep(period);
                return await this.retryOperation(nTimes - 1, period, fn);
            }
        });
    }

    filterOrderersOut(organizations) {
        return _.filter(organizations,
            o => !_.includes(_.get(o, 'id'), 'orderer')
                && !_.includes(_.get(o, 'id'), 'osn')
                && !_.includes(_.get(o, 'id'), 'raft'));
    }

    loadPemFromFile(pemFilePath) {
        let certData = fs.readFileSync(pemFilePath);
        return Buffer.from(certData).toString()
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


    convertStringValToMapVal(keyValueMap) {
        return _.mapValues(keyValueMap, value => _.keyBy(_.split(value, ' '), v => v));
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
        const result = _.mapValues(hostsMap, valKV => _.join(_.keys(valKV), ' '));
        return result;
    }

    writeHostFile(keyValueHostRecords, dir) {
        const file = path.join(dir, 'hosts')
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

    splitOutputToMultiline(str) {
        return _.split(str, '\n')
    }

    sortAndFilterObjectProps(obj, filterFunc = () => true) {
        return _.reduce(_.entries(obj).filter(filterFunc).sort(),
            (res, entry) => {
                res[entry[0]] = entry[1];
                return res
            },
            {}
        );
    }

}

module.exports = new Util();
