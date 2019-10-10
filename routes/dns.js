// when adding a new org:
// ./chaincode-invoke.sh common dns '["put","192.168.99.102","peer0.org2.example.com www.org2.example.com"]'
// verify ip was added to hosts file and the name is now resolvable
// docker exec api.org1.example.com wget peer0.org2.example.com

module.exports = async (app, _fabricStarterClient, eventBus) => {
    const fs = require('fs');
    const _ = require('lodash');
    const logger = require('log4js').getLogger('dns');
    const FabricStarterClient = require('../fabric-starter-client');
    const fabricStarterClient = new FabricStarterClient();
    const util = require('../util');

    const NODE_HOSTS_FILE = '/etc/hosts';
    const ORDERER_HOSTS_FILE = '/etc/hosts_orderer';

    const channel = process.env.DNS_CHANNEL || 'common';
    const chaincodeName = process.env.DNS_CHAINCODE || 'dns';
    const username = process.env.DNS_USERNAME || 'dns';
    const password = process.env.DNS_PASSWORD || 'pass';
    const skip = !process.env.MULTIHOST;
    const period = process.env.DNS_PERIOD || 60000;
    const orgDomain = `${process.env.ORG}.${process.env.DOMAIN}`;
    const myIp = process.env.MY_IP;
    const ordererDomain = process.env.ORDERER_DOMAIN || process.env.DOMAIN;
    const queryTarget = process.env.DNS_QUERY_TARGET || `peer0.${orgDomain}:${process.env.PEER0_PORT||7051}`;

    let blockListenerStarted = false;

    logger.info('started');

    setInterval(async () => {
        logger.info(`periodically query every ${period} msec for dns entries and update ${NODE_HOSTS_FILE}`);
        try {
            await processEvent();
        } catch (e) {
            logger.error("setInterval error", e);
        }
    }, period);

    await processEvent();

    async function processEvent() {
        if (skip) {
            logger.info('Skipping dns track as not MULTIHOST');
            return;
        }

        if (!blockListenerStarted) {
            try {
                await login();
                await startBlockListener();
                blockListenerStarted = true;
            } catch (e) {
                logger.warn("Can't start DNS block listener", e);
                return;
            }
        }

        const dnsResponses = await fabricStarterClient.query(channel, chaincodeName, 'get', '["dns"]', {targets: queryTarget});
        logger.debug('dnsResponses', dnsResponses);

        if (dnsResponses) {
            try {
                let keyValueHostRecords = JSON.parse(dnsResponses);
                keyValueHostRecords = filterOutByIp(keyValueHostRecords, myIp);
                logger.debug("DNS after org filtering:", keyValueHostRecords);

                 // let hostsFileContent = generateHostsRecords(keyValueHostRecords);

                writeFile(NODE_HOSTS_FILE, keyValueHostRecords);
                writeFile(ORDERER_HOSTS_FILE, keyValueHostRecords);
            } catch (e) {
                logger.warn("Unparseable dns-records: \n", dnsResponses);
            }
        }

        const osnResponses = await fabricStarterClient.query(channel, chaincodeName, 'get', '["osn"]', {targets: queryTarget});
        logger.debug('osnResponses', osnResponses);

        if (osnResponses) {
            try {
                let keyValueHostRecords = JSON.parse(osnResponses);
                eventBus.emit('osn-configuration-changed', keyValueHostRecords);
            } catch (e) {
                logger.error(`Can't parse OSN record: ${osnResponses}`, e);
            }
        }
    }

    async function login() {
        await fabricStarterClient.init();
        await fabricStarterClient.loginOrRegister(username, password);

        logger.info(`logged in as ${username}`);
    }


    async function startBlockListener() {
        logger.info(`logged in as ${username}`);

        logger.info(`Trying to start DNS block listener on channel ${channel}`);
        await fabricStarterClient.registerBlockEvent(channel, async block => {
            logger.debug(`block ${block.number} on ${block.channel_id}`);
            await processEvent();
        }, e => {
            throw new Error(e);
        });
    }

    function existsAndIsFile(file) {
        try {
            fs.accessSync(file, fs.constants.W_OK);
            return fs.statSync(file).isFile()
        } catch (e) {
            logger.debug(`Cannot open file ${file}`, e);
        }
    }


    function writeFile(file, keyValueHostRecords) {
        if (existsAndIsFile(file))
        {
            try {
                const currHostsLines = fs.readFileSync(file, 'utf-8').split('\n');
                const currHosts = util.linesToKeyValueList(currHostsLines);

                let newHostsMap = util.mergeKeyValueLists(currHosts, keyValueHostRecords);

                let hostsFileContent = `# replaced by dns listener on ${channel}\n`;
                _.forOwn(newHostsMap, (value, key)=> {
                    hostsFileContent = hostsFileContent+ key + ' ' + value+ '\n';
                });

                fs.writeFileSync(file, hostsFileContent);

                logger.info(`written: ${file}\n`, hostsFileContent);
            } catch (err) {
                logger.error(`cannot writeFile ${file}`, err);
            }
         else {
            logger.debug(`Skipping ${file}`);
        }
    }


    function filterOutByIp(list, ip) {
        delete list[ip];
        return list;
    }

    function generateHostsRecords(list) {
        let h = `# replaced by dns listener on ${channel}\n`;
        _.forEach(_.keys(list), ip => {
            h = h.concat(ip, ' ', list[ip], '\n');
        });
        return h;
    }
};
