const util = require('../util');
const cfg = require('../config.js');
const log4jsConfigured = require('../util/log/log4js-configured');
const logger = log4jsConfigured.getLogger('LocalDns.js');

const channel = cfg.DNS_CHANNEL;
const chaincodeName = cfg.DNS_CHAINCODE;


async function updateLocalDnsStorageFromChaincode(fabricStarterClient) {
    logger.info("Update local dns information")
    let dnsRecords = await getChaincodeData(fabricStarterClient, "dns");
    if (dnsRecords) {
        dnsRecords = filterOutByIp(dnsRecords, cfg.myIp);
        util.writeHostFile(dnsRecords, cfg.CRYPTO_CONFIG_DIR);
    }
}

async function getChaincodeData(fabricStarterClient, dataKey) {
    let result = null;
    const dataResponses = await fabricStarterClient.query(channel, chaincodeName, 'get', `["${dataKey}"]`, {targets: process.env.DNS_QUERY_TARGET || `${cfg.peerName}.${cfg.org}.${cfg.domain}:${cfg.peer0Port}`});
    logger.debug(`dataResponses for ${dataKey}`, dataResponses);
    try {
        if (dataResponses && dataResponses[0] !== '') {
            result = JSON.parse(dataResponses);
        }
    } catch (e) {
        logger.warn(`Can't parse chaincode data record: ${dataResponses}`, e);
    }
    return result;
}

function filterOutByIp(list, excludeIp) {
    delete list[excludeIp];
    return list;
}

module.exports = {
    updateLocalDnsStorageFromChaincode : updateLocalDnsStorageFromChaincode,
    getChaincodeData: getChaincodeData
}