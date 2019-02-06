const fs=require('fs');
const log4js = require('log4js');
log4js.configure({appenders: {stdout: {type: 'stdout'}}, categories: {default: {appenders: ['stdout'], level: 'ALL'}}});
const logger = log4js.getLogger('config.js');

const myorg = process.env.ORG || 'org1';
const DOMAIN = process.env.DOMAIN || 'example.com';

const CRYPTO_CONFIG_DIR = "crypto-config";
let cryptoConfigPath = fs.realpathSync(process.env.CRYPTO_CONFIG_DIR || '../fabric-starter/crypto-config');

logger.info(`Crypto-config path: ${cryptoConfigPath}`);

const enrollId = process.env.ENROLL_ID || 'admin';
const enrollSecret = process.env.ENROLL_SECRET || 'adminpw';

// default to peer0.org1.example.com:7051 inside docker-compose or export ORGS='{"org1":"peer0.org1.example.com:7051","org2":"peer0.org2.example.com:7051"}'
let orgs = process.env.ORGS || `"${myorg}":"peer0.${myorg}.${DOMAIN}:7051"`;
let cas = process.env.CAS || `"${myorg}":"ca.${myorg}.${DOMAIN}:7054"`;

const ORDERER_CRYPTO_DIR = `${cryptoConfigPath}/ordererOrganizations/${DOMAIN}`;
const PEER_CRYPTO_DIR = `${cryptoConfigPath}/peerOrganizations/${myorg}.${DOMAIN}`;

const ordererName = 'orderer';
const ordererAddr = `orderer.${DOMAIN}:7050`;
const ordererApiPort = process.env.ORDERER_API_PORT || '4500';
const ordererApiAddr = `api.${DOMAIN}:${ordererApiPort}`;

const systemChannelId = "orderer-system-channel";

module.exports = {
    log4js: log4js,
    domain: DOMAIN,
    org: myorg,

    enrollId: enrollId,
    enrollSecret: enrollSecret,
    orgs: orgs,
    cas: cas,

    ordererName: ordererName,
    CRYPTO_CONFIG_DIR: CRYPTO_CONFIG_DIR,
    ORDERER_CRYPTO_DIR: ORDERER_CRYPTO_DIR,
    ORDERER_TLS_CERT: `${ORDERER_CRYPTO_DIR}/msp/tlscacerts/tlsca.${DOMAIN}-cert.pem`,
    ORDERER_ADDR: ordererAddr,
    ORDERER_API_ADDR: ordererApiAddr,

    PEER_CRYPTO_DIR: PEER_CRYPTO_DIR,
    orgCryptoConfigPath: (org) => `${cryptoConfigPath}/peerOrganizations/${org}.${DOMAIN}`,

    systemChannelId: systemChannelId,


    isOrderer: ordererName == myorg,

    INVOKE_RETRY_COUNT: process.env.INVOKE_RETRY_COUNT || 3,
    JOIN_RETRY_COUNT: process.env.JOIN_RETRY_COUNT || 10

};
