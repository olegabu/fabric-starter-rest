const fs = require('fs-extra');
const log4jsConfigured = require('./util/log/log4js-configured');
const logger = log4jsConfigured.getLogger('config.js');

const gostConfig = require('./gost-deps/crypto-suit-config');

let cryptoConfigPath = fs.realpathSync(process.env.CRYPTO_CONFIG_DIR || '../fabric-starter/crypto-config');
logger.info(`Crypto-config path: ${cryptoConfigPath}`);

const TEMPLATES_DIR = process.env.TEMPLATES_DIR || '/etc/hyperledger/templates';
const YAMLS_DIR = process.env.YAMLS_DIR || `${TEMPLATES_DIR}/..`;
const ENROLL_ID = process.env.ENROLL_ID || 'admin';

const ordererNamePrefix = process.env.ORDERER_NAME_PREFIX || 'raft';
const ordererBatchTimeout = process.env.ORDERER_BATCH_TIMEOUT || '2';

const systemChannelId = process.env.SYSTEM_CHANNEL_ID || "orderer-system-channel";

const PEER_CONFIG_FILE = process.env.PEER_CONFIG_FILE || `node-config${process.env.DEBUG_INSTANCE ? '-' + process.env.DEBUG_INSTANCE : ''}.json`
logger.info(`PEER_CONFIG_FILE: ${PEER_CONFIG_FILE}`);

const persistedConfig = fs.readJsonSync(PEER_CONFIG_FILE, {throws: false}) || {}

module.exports = {
    log4js:  log4jsConfigured, //TODO: remove from config, use directly
    systemChannelId: systemChannelId,
    ENROLL_ID: ENROLL_ID,
    CRYPTO_CONFIG_DIR: cryptoConfigPath,
    TEMPLATES_DIR: TEMPLATES_DIR,
    YAMLS_DIR: YAMLS_DIR,
    FABRIC_STARTER_HOME: process.env.FABRIC_STARTER_HOME || process.env.FABRIC_STARTER_PWD || './',
    FABRIC_VERSION: process.env.FABRIC_VERSION,
    FABRIC_STARTER_VERSION: process.env.FABRIC_STARTER_VERSION,
    DEFAULT_CONSORTIUM: process.env.DEFAULT_CONSORTIUM || 'SampleConsortium',
    BOOTSTRAP_SERVICE_URL: process.env.BOOTSTRAP_SERVICE_URL || 'https',
    BOOTSTRAP_EXTERNAL_PORT: process.env.BOOTSTRAP_EXTERNAL_PORT || '443',
    API_PORT: process.env.API_PORT || '4000',

    USE_SERVICE_DISCOVERY: typeof process.env.USE_SERVICE_DISCOVERY === "undefined" || process.env.USE_SERVICE_DISCOVERY === "true",
    WEBADMIN_DIR: process.env.WEBADMIN_DIR || "./admin",

    WEBAPPS_DIR: process.env.WEBAPPS_DIR || "webapps",
    MIDDLWARE_DIR: process.env.MIDDLWARE_DIR || "./routes",
    APPSTORE_DIR: process.env.APPSTORE_DIR || "./appstore",

    UI_LISTEN_BLOCK_OPTS: process.env.UI_LISTEN_BLOCK_OPTS === "true" || process.env.UI_LISTEN_BLOCK_OPTS,

    DNS_CHANNEL: process.env.DNS_CHANNEL || "common",
    DNS_CHAINCODE: process.env.DNS_CHAINCODE || "dns",
    DNS_UPDATE_TIMEOUT: process.env.DNS_UPDATE_TIMEOUT || 4000,
    CHANNEL_LISTENER_UPDATE_TIMEOUT: process.env.CHANNEL_LISTENER_UPDATE_TIMEOUT || 10000,
    CHAINCODE_PROCESSING_TIMEOUT: process.env.CHAINCODE_PROCESSING_TIMEOUT || 120000,

    INVOKE_RETRY_COUNT: process.env.INVOKE_RETRY_COUNT || 1,
    JOIN_RETRY_COUNT: process.env.JOIN_RETRY_COUNT || 10,
    LISTENER_RETRY_COUNT: process.env.LISTENER_RETRY_COUNT || 20,

    ORDERER_NAME_PREFIX: ordererNamePrefix,
    ORDERER_BATCH_TIMEOUT: ordererBatchTimeout,

    DEFAULT_PEER0PORT: '7051',
    HARDCODED_ORDERER_NAME: process.env.HARDCODED_ORDERER_NAME || 'orderer',

    get SDK_API_URL() { return process.env.SDK_API_URL || `sdk.${this.org}.${this.domain}:8080`},

    get org() {return persistedConfig.ORG || process.env.ORG || ''},

    setOrg(val) {
        persistedConfig.ORG = val
        persistConfig()
    },

    get domain() {return persistedConfig.DOMAIN || process.env.DOMAIN || 'example.com'},

    setDomain(val) {
        persistedConfig.DOMAIN = val
        persistConfig()
    },

    get peerName() {return persistedConfig.PEER_NAME || process.env.PEER_NAME || 'peer0'},

    setPeerName(val) {
        persistedConfig.PEER_NAME = val
        persistConfig()
    },

    get myIp() {return persistedConfig.MY_IP || process.env.MY_IP},

    setMyIp(val) {
        persistedConfig.MY_IP = val
        persistConfig()
    },

    get masterIp() {return persistedConfig.MASTER_IP || process.env.MASTER_IP || this.myIp},

    setMasterIp(val) {
        persistedConfig.MASTER_IP = val
        persistConfig()
    },

    get bootstrapIp() {return persistedConfig.BOOTSTRAP_IP || process.env.BOOTSTRAP_IP},

    setBootstrapIp(val) {
        persistedConfig.BOOTSTRAP_IP = val
        persistConfig()
    },

    get peer0Port() {return persistedConfig.PEER0_PORT || process.env.PEER0_PORT || this.DEFAULT_PEER0PORT},

    setPeer0Port(val) {
        persistedConfig.PEER0_PORT = val
        persistConfig()
    },

    get ordererName() {return persistedConfig.ORDERER_NAME || process.env.ORDERER_NAME || 'orderer';},

    setOrdererName(val) {
        persistedConfig.ORDERER_NAME = val
        persistConfig()
    },

    get ordererDomain() {return persistedConfig.ORDERER_DOMAIN || process.env.ORDERER_DOMAIN || this.domain;},

    setOrdererDomain(val) {
        persistedConfig.ORDERER_DOMAIN = val
        persistConfig()
    },

    get ordererMspId() {return persistedConfig.ORDERER_MSPID || `${this.ordererName}.${this.ordererDomain}`},

    setOrdererMspId(val) {
        persistedConfig.ORDERER_MSPID = val
        persistConfig()
    },

    get ordererPort() {return persistedConfig.ORDERER_PORT || process.env.ORDERER_GENERAL_LISTENPORT || '7050'},

    setOrdererPort(val) {
        persistedConfig.ORDERER_PORT = val
        persistConfig()
    },

    get ORDERER_ADDR() {return persistedConfig.ORDERER_ADDR || `${this.ordererName}.${this.ordererDomain}:${this.ordererPort}`},

    setOrdererAddr(val) {
        persistedConfig.ORDERER_ADDR = val
        persistConfig()
    },

    get ordererWwwPort() {return persistedConfig.ORDERER_WWW_PORT || process.env.ORDERER_WWW_PORT || 79},

    setOrdererWwwPort(val) {
        persistedConfig.ORDERER_WWW_PORT = val
        persistConfig()
    },

    get enrollSecret() {return persistedConfig.ENROLL_SECRET || process.env.ENROLL_SECRET || 'adminpw';},

    setEnrollSecret(val) {
        persistedConfig.ENROLL_SECRET = val
        persistConfig()
    },

    get masterCAPort() {return persistedConfig.MASTER_CA_PORT || process.env.MASTER_CA_PORT || '7054'},

    setMasterCAPort(val) {
        persistedConfig.MASTER_CA_PORT = val
        persistConfig()
    },

    get masterTLSCAPort() {return persistedConfig.MASTER_TLSCA_PORT || process.env.MASTER_TLSCA_PORT || '7055'},

    setMasterTLSCAPort(val) {
        persistedConfig.MASTER_TLSCA_PORT = val
        persistConfig()
    },

    get ordererCryptoDir() {return `${cryptoConfigPath}/ordererOrganizations/${this.ordererDomain}` },
    get ORDERER_TLS_CERT() {return `${this.ordererCryptoDir}/msp/tlscacerts/tlsca.${this.ordererDomain}-cert.pem` },

    // default to peer0.org1.example.com:7051 inside docker-compose or export ORGS='{"org1":"peer0.org1.example.com:7051","org2":"peer0.org2.example.com:7051"}'
    get orgs() {return process.env.ORGS || `"${this.org}":"${this.peerName}.${this.org}.${this.domain}:${this.peer0Port}"`},
    get cas() {return process.env.CAS || `"${this.org}":"ca.${this.org}.${this.domain}:${this.masterCAPort}"`},
    get tlsCas() {return process.env.TLS_CAS || `"${this.org}":"tlsca.${this.org}.${this.domain}:${this.masterTLSCAPort}"`},

    get ORG_CRYPTO_DIR() {return `${cryptoConfigPath}/peerOrganizations/${this.org}.${this.domain}`},

    get CORE_PEER_LOCALMSPID() {return this.org},
    get CORE_PEER_MSPCONFIGPATH() {return `${cryptoConfigPath}/peerOrganizations/${this.org}.${this.domain}/users/Admin@${this.org}.${this.domain}/msp`},

    get certificationDomain() { return `${this.org}.${this.domain}`},

    get RAFT0_PORT(){return process.env.RAFT0_PORT || this.ordererPort},
    RAFT1_PORT: process.env.RAFT1_PORT || '7150',
    RAFT2_PORT: process.env.RAFT2_PORT || '7250',

    ACCEPT_ALL_ORGS: process.env.ACCEPT_ALL_ORGS !== 'false',

    CUSTOM_APP_PORTS: process.env.CUSTOM_APP_PORTS || '8080-8089',

    AUTH_MODE: process.env.AUTH_MODE || (process.env.CRYPTO_ALGORITHM === 'GOST' ? 'ADMIN' : 'CA'),
    SIGNATURE_HASH_FAMILY: process.env.SIGNATURE_HASH_FAMILY || (process.env.CRYPTO_ALGORITHM === 'GOST' ? 'SM3' : 'SHA2'),
    CRYPTO_SUIT_CONFIG: process.env.CRYPTO_ALGORITHM === 'GOST' ? gostConfig : {},

    AUTH_JWT_EXPIRES_IN: (/^\d+$/.test(process.env.AUTH_JWT_EXPIRES_IN) ? parseInt(process.env.AUTH_JWT_EXPIRES_IN) : process.env.AUTH_JWT_EXPIRES_IN) || '8h',
    DOCKER_COMPOSE_EXTRA_ARGS: process.env.DOCKER_COMPOSE_EXTRA_ARGS || ''
};

function persistConfig() {
    fs.outputJsonSync(PEER_CONFIG_FILE, persistedConfig)
}
