const fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    envsub = require('envsub'),
    shell = require('shelljs'),
    Enum  = require('enumify').Enum;

const cfg = require('./config.js');
const logger = cfg.log4js.getLogger('FabricCLI');


const CERT_FOLDERS_PREFIXES = {
    'admincerts': {certFileNamePart: 'Admin@', envVar: 'ORG_ADMIN_CERT'},
    'cacerts': {certFileNamePart: 'ca.', envVar: 'ORG_ROOT_CERT'},
    'tlscacerts': {certFileNamePart: 'tlsca.', envVar: 'ORG_TLS_ROOT_CERT'}
};

const WGET_OPTS = process.env.WGET_OPTS || '-N';

class TRANSLATE_OP extends Enum {}
TRANSLATE_OP.initEnum(['proto_encode', 'proto_decode', 'compute_update']);

class CONFIG_TYPE extends Enum {}
CONFIG_TYPE.initEnum(['common.Config', 'common.Block', 'common.ConfigUpdate', 'common.Envelope']);

class FabricCLI {

    downloadCerts(orgDomain, org) {
        _.forEach(_.keys(CERT_FOLDERS_PREFIXES), certFolder => {
            let certPrefix=CERT_FOLDERS_PREFIXES[certFolder];
            let directoryPrefix = this.getCertFileDir(certFolder, org ? cfg.orgCryptoConfigPath(org) : cfg.ORDERER_CRYPTO_DIR);
            let certFileName = this.getCertFileName(certPrefix, org);
            shell.exec(`/usr/bin/wget ${WGET_OPTS} --directory-prefix ${directoryPrefix} http://www.${orgDomain}/msp/${certFolder}/${certFileName}`);
        });
    }

    downloadOrdererMSP() {
        this.downloadCerts(cfg.domain);
    }

    downloadOrgMSP(org) {
        this.downloadCerts(`${org}.${cfg.domain}`, org);
    }


    execShellCommand(cmd) {
        logger.debug(cmd);
        shell.exec(`${cmd} &2>1`);
    }

    async envSubst(templateFile, outputFile, env) {
        let envs = _.map(_.keys(env), k => new Object({name: k, value: env[k]}));
        return envsub({templateFile, outputFile, options: Object.assign({diff: false}, {envs: envs})});
    }


    generateConfigTxForChannel(channelName, configDir, profile, outputTxFile) {
        this.execShellCommand(`configtxgen -channelID ${channelName} -configPath ${configDir} -profile ${profile} -outputCreateChannelTx ${outputTxFile}`)
    }

    execPeerCommand(command, paramsStr) {
        this.execShellCommand(`peer ${command} -o ${cfg.ORDERER_ADDR} --tls --cafile ${cfg.ORDERER_TLS_CERT} ${paramsStr}`);
    }

    async generateChannelConfigTx(channelId) {
        await this.envSubst("templates/configtx-template.yaml", `${cfg.CRYPTO_CONFIG_DIR}/configtx.yaml`);
        let outputTxFile = `${cfg.CRYPTO_CONFIG_DIR}/configtx/channel_${channelId}.tx`;
        this.generateConfigTxForChannel(channelId, cfg.CRYPTO_CONFIG_DIR, "CHANNEL", outputTxFile);
        return outputTxFile;
    }

    async generateChannelConfigTxContent(channelId) {
        let channelTxFile = await this.generateChannelConfigTx(channelId);
        return this.loadFileContent(channelTxFile);
    }


    async fetchChannelConfigToFile(channelId) {
        const filePath = this.fetchChannelConfig(channelId);
        return this.loadFileContent(filePath);
    }

    fetchChannelConfig(channelId) {
        const channelConfigFile = `${channelId}_config.pb`;
        const outputFilePath = `${cfg.CRYPTO_CONFIG_DIR}/${channelConfigFile}`;
        this.execPeerCommand(`channel fetch config ${outputFilePath}`, `-c ${channelId}`);
        return outputFilePath;
    }

    computeConfigUpdate(channelId, originalFileName, updatedFileName, outputFileName) {
        this.execShellCommand(`configtxlator compute_update --channel_id=${channelId} --original=${originalFileName} --updated=${updatedFileName} --output=${outputFileName}`);

    }

    translateProtobufConfig(translateOp, configType, inputFilename, outputFileName) {
        this.execShellCommand(`configtxlator ${translateOp.name} --type ${configType.name} --input=${inputFilename} --output=${outputFileName}`);
    }

    translateChannelConfig(configFileName) {
        const outputFileName = `${path.dirname(configFileName)}/${path.basename(configFileName, ".pb")}.json`;
        this.translateProtobufConfig(TRANSLATE_OP.proto_decode,  CONFIG_TYPE['common.Block'], configFileName, outputFileName);
        return this.loadFileContentSync(outputFileName);
    }


    computeChannelConfigUpdate(channelId, originalConfig, configWithChangesJson) {

        const originalConfigJsonFile = `${cfg.CRYPTO_CONFIG_DIR}/${channelId}_originalConfig.json`;
        const originalConfigPbFile = `${cfg.CRYPTO_CONFIG_DIR}/${channelId}_originalConfig.pb`;
        const updatedConfigWithJsonFile = `${cfg.CRYPTO_CONFIG_DIR}/${channelId}_configUpdate.json`;
        const updatedConfigPbFile = `${cfg.CRYPTO_CONFIG_DIR}/${channelId}_configUpdate.pb`;
        const computedUpdatePbFileName= `${cfg.CRYPTO_CONFIG_DIR}/${channelId}_update.pb`;


        fs.writeFileSync(originalConfigJsonFile, JSON.stringify(originalConfig));
        this.translateProtobufConfig(TRANSLATE_OP.proto_encode, CONFIG_TYPE["common.Config"], originalConfigJsonFile, originalConfigPbFile);

        fs.writeFileSync(updatedConfigWithJsonFile, JSON.stringify(configWithChangesJson));
        this.translateProtobufConfig(TRANSLATE_OP.proto_encode, CONFIG_TYPE['common.Config'], updatedConfigWithJsonFile, updatedConfigPbFile);
        this.computeConfigUpdate(channelId, originalConfigPbFile, updatedConfigPbFile, computedUpdatePbFileName);

        return this.loadFileContentSync(computedUpdatePbFileName);
    }

    async prepareComputeUpdateEnvelope(channelId, originalConfig, configWithChangesJson) { //todo: for future reuse
        await this.computeChannelConfigUpdate(channelId, originalConfig, configWithChangesJson);

        const computedUpdatePbFileName= `${cfg.CRYPTO_CONFIG_DIR}/${channelId}_update.pb`;
        const computedUpdateJsonFile= `${cfg.CRYPTO_CONFIG_DIR}/${channelId}_update.json`;
        const updateEnvelopeJsonFile= `${cfg.CRYPTO_CONFIG_DIR}/${channelId}_update_envelope.json`;
        const updateEnvelopePbFile= `${cfg.CRYPTO_CONFIG_DIR}/${channelId}_update_envelope.pb`;


        this.translateProtobufConfig(TRANSLATE_OP.proto_decode, CONFIG_TYPE["common.ConfigUpdate"], computedUpdatePbFileName, computedUpdateJsonFile);
        let computedUpdate = this.loadFileContentSync(computedUpdateJsonFile);
        computedUpdate=JSON.parse(_.toString(computedUpdate));
        let envelope = JSON.stringify({payload: {header: {channel_header: {channel_id: channelId, type: 2}},data: {config_update: computedUpdate}}});
        fs.writeFileSync(updateEnvelopeJsonFile, envelope);
        this.translateProtobufConfig(TRANSLATE_OP.proto_encode, CONFIG_TYPE['common.Envelope'], updateEnvelopeJsonFile, updateEnvelopePbFile);

        return this.loadFileContentSync(updateEnvelopePbFile);
    }

    async prepareNewOrgConfig(newOrg) {
        this.downloadOrgMSP(newOrg);

        let env = {NEWORG: newOrg, DOMAIN:cfg.domain};
        _.forEach(_.keys(CERT_FOLDERS_PREFIXES), certFolder => {
            let certPrefix=CERT_FOLDERS_PREFIXES[certFolder];
            let certFilePath = path.join(this.getCertFileDir(certFolder, cfg.orgCryptoConfigPath(newOrg)), this.getCertFileName(certPrefix, newOrg));
            let certContent = this.loadFileContentSync(certFilePath);
            env[certPrefix.envVar]=Buffer.from(certContent).toString('base64');
        });

        const outputFile = `crypto-config/${newOrg}_NewOrg.json`;
        let newOrgSubstitution = await this.envSubst("templates/NewOrg.json", outputFile, env);

        return {outputFile, outputJson: JSON.parse(newOrgSubstitution.outputContents)};
    }

    getCertFileDir(certFolder, domaiCertPath) {
        return `${domaiCertPath}/msp/${certFolder}`;
    }

    getCertFileName(certPrefix, org) {
        let domainCertPath = org ? `${org}.${cfg.domain}` : cfg.domain;
        let certFileName = `${certPrefix.certFileNamePart}${domainCertPath}-cert.pem`;
        return certFileName;
    }


    loadFileContent(fileName) {
        return new Promise((resolve, reject) => {
            fs.readFile(fileName, (err, data) => {
                !err ? resolve(data) : reject(err);
            })
        }).catch(err => {
            logger.error(err);
            throw new Error(err);
        })
    }

    loadFileContentSync(fileName) {
       return fs.readFileSync(fileName);
    }
}


module.exports = new FabricCLI();

