const fs = require('fs');

const myorg = process.env.ORG || 'org1';
const DOMAIN = process.env.DOMAIN || 'example.com';

let cryptoConfigDir = process.env.CRYPTO_CONFIG_DIR || '../fabric-starter/crypto-config';

console.log(`Crypto-config path: ${cryptoConfigDir}`);

const enrollId = process.env.ENROLL_ID || 'admin';
const enrollSecret = process.env.ENROLL_SECRET || 'adminpw';

// default to peer0.org1.example.com:7051 inside docker-compose or export ORGS='{"org1":"peer0.org1.example.com:7051","org2":"peer0.org2.example.com:7051"}'
let orgs = process.env.ORGS || '"org1":"peer0.org1.example.com:7051"';
let cas = process.env.CAS || '"org1":"peer0.org1.example.com:7054"';

const ORDERER_CRYPTO_DIR = `${cryptoConfigDir}/ordererOrganizations/${DOMAIN}`;
const PEER_CRYPTO_DIR = `${cryptoConfigDir}/peerOrganizations/${myorg}.${DOMAIN}`;

const ordererName = 'orderer';
const ordererAddr = `orderer.${DOMAIN}:7050`;
const ordererApiPort = process.env.ORDERER_API_PORT ||'4500';
const ordererApiAddr = `api.${DOMAIN}:${ordererApiPort}`;

const systemChannelId = "orderer-system-channel";

module.exports = {
    domain: DOMAIN,
    org: myorg,

    enrollId: enrollId,
    enrollSecret: enrollSecret,
    orgs: orgs,
    cas: cas,

    ordererName: ordererName,
    ORDERER_CRYPTO_DIR: ORDERER_CRYPTO_DIR,
    ORDERER_TLS_CERT: `${ORDERER_CRYPTO_DIR}/msp/tlscacerts/tlsca.${DOMAIN}-cert.pem`,
    ORDERER_ADDR: ordererAddr,
    ORDERER_API_ADDR: ordererApiAddr,

    PEER_CRYPTO_DIR: PEER_CRYPTO_DIR,

    systemChannelId: systemChannelId,


    isOrderer: ordererName == myorg,

    INVOKE_RETRY_COUNT: process.env.INVOKE_RETRY_COUNT || 10

};
