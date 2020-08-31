const fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    envsub = require('envsub'),
    shell = require('shelljs'),
    Enum = require('enumify').Enum;


const cfg = require('./config'),
    util = require('./util'),
    certsManager = require('./certs-manager');

const logger = cfg.log4js.getLogger('FabricCLI');

const WGET_OPTS = process.env.WGET_OPTS || '-N';

class TRANSLATE_OP extends Enum {
}

TRANSLATE_OP.initEnum(['proto_encode', 'proto_decode', 'compute_update']);

class CONFIG_TYPE extends Enum {
}

CONFIG_TYPE.initEnum(['common.Config', 'common.Block', 'common.ConfigUpdate', 'common.Envelope']);

class FabricCLI {

    async downloadCerts(orgObj, domain = cfg.domain, wwwPort) {
        const orgDomain = orgObj ? `${orgObj.orgId}.${domain}` : domain;
        let wwwHost = `www.${orgDomain}`;
        wwwPort = wwwPort || 80;
        // await util.checkRemotePort(wwwHost, wwwPort); TODO: same host orderer port is not available when in docker
        certsManager.forEachCertificate(orgObj, domain,
            (certificateSubDir, fullCertificateDirectoryPath, certificateFileName, directoryPrefixConfig) => {
            shell.exec(`/usr/bin/wget ${WGET_OPTS} --directory-prefix ${fullCertificateDirectoryPath} http://${wwwHost}:${wwwPort || 80}/msp/${certificateSubDir}/${certificateFileName}`);
        });
    }

    async downloadOrdererMSP(wwwPort = cfg.ORDERER_WWW_PORT, ordererDomain=cfg.ORDERER_DOMAIN) {
        await this.downloadCerts(null, ordererDomain, wwwPort);
    }

    async downloadOrgMSP(orgObj, domain = cfg.domain) {
        //TODO:await util.checkRemotePort(`www.${orgObj.orgId}.${domain}`, orgObj.wwwPort || 80);
        await this.downloadCerts(orgObj, domain, orgObj.wwwPort);
    }

    execShellCommand(cmd, dir, extraEnv) {
        const env = _.assign({}, process.env, extraEnv || {});
        const opts = {env: env};
        if (dir) {
            cmd=`cd ${dir}; ${cmd}`;
        }
        logger.debug(cmd);
        shell.exec(`${cmd} &2>1`, opts);
    }

    async envSubst(templateFile, outputFile, env) {
        let envs = _.map(_.keys(env), k => new Object({name: k, value: env[k]}));
        logger.debug(`Envsubst: ${templateFile} to ${outputFile}`);
        logger.debug(envs);
        return envsub({templateFile, outputFile, options: Object.assign({diff: false}, {envs: envs})});
    }


    generateConfigTxForChannel(channelName, configDir, profile, outputTxFile) {
        this.execShellCommand(`configtxgen -channelID ${channelName} -configPath ${configDir} -profile ${profile} -outputCreateChannelTx ${outputTxFile}`)
    }

    execPeerCommand(command, paramsStr, extraEnv) {
        this.execShellCommand(`echo $CORE_PEER_LOCALMSPID`, null, extraEnv);
        this.execShellCommand(`peer ${command} -o ${cfg.ORDERER_ADDR} --tls --cafile ${cfg.ORDERER_TLS_CERT} ${paramsStr}`, null, extraEnv);
    }

    async generateChannelConfigTx(channelId) {
        await this.envSubst(`${cfg.TEMPLATES_DIR}/configtx-template.yaml`, `${cfg.CRYPTO_CONFIG_DIR}/configtx.yaml`, this.getEnv());

        let outputTxFile = `${cfg.CRYPTO_CONFIG_DIR}/configtx/channel_${channelId}.tx`;
        this.generateConfigTxForChannel(channelId, cfg.CRYPTO_CONFIG_DIR, "CHANNEL", outputTxFile);
        return outputTxFile;
    }

    createChannelByCli(channelName) {
        let arg = ` -c ${channelName} -f ${cfg.CRYPTO_CONFIG_DIR}/configtx/channel_${channelName}.tx `;
        this.execPeerCommand('channel create', arg);
    }

    getEnv(extraEnv) {
        return _.assign({
            DOMAIN: cfg.DOMAIN,
            ORG: cfg.org,
            PEER0_PORT: cfg.peer0Port,
            ORDERER_NAME: cfg.ordererName,
            ORDERER_DOMAIN: cfg.ORDERER_DOMAIN,
            ORDERER_NAME_PREFIX: cfg.ORDERER_NAME_PREFIX,
            ORDERER_BATCH_TIMEOUT: cfg.ORDERER_BATCH_TIMEOUT,
            ORDERER_GENERAL_LISTENPORT: cfg.ordererPort,
            RAFT0_PORT: cfg.RAFT0_PORT,
            RAFT1_PORT: cfg.RAFT1_PORT,
            RAFT2_PORT: cfg.RAFT2_PORT
        }, extraEnv);
    }

    async generateChannelConfigTxContent(channelId) {
        let channelTxFile = await this.generateChannelConfigTx(channelId);
        return this.loadFileContent(channelTxFile);
    }


    async fetchChannelConfigToFile(channelId) {
        const filePath = this.fetchChannelConfig(channelId);
        return this.loadFileContent(filePath);
    }

    fetchChannelConfig(channelId, extraEnv) {
        const channelConfigFile = `${channelId}_config.pb`;
        const outputFilePath = `${cfg.CRYPTO_CONFIG_DIR}/${channelConfigFile}`;
        this.execPeerCommand(`channel fetch config ${outputFilePath}`, `-c ${channelId}`, extraEnv);
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
        this.translateProtobufConfig(TRANSLATE_OP.proto_decode, CONFIG_TYPE['common.Block'], configFileName, outputFileName);
        const channelConfigProtobuf = this.loadFileContentSync(outputFileName);
        const channelConfigEnvelope = JSON.parse(_.toString(channelConfigProtobuf));
        let origChannelGroupConfig = _.get(channelConfigEnvelope, "data.data[0].payload.data.config");

        return origChannelGroupConfig;
    }


    computeChannelConfigUpdate(channelId, originalConfig, configWithChangesJson) {

        const originalConfigJsonFile = `${cfg.CRYPTO_CONFIG_DIR}/${channelId}_originalConfig.json`;
        const originalConfigPbFile = `${cfg.CRYPTO_CONFIG_DIR}/${channelId}_originalConfig.pb`;
        const updatedConfigWithJsonFile = `${cfg.CRYPTO_CONFIG_DIR}/${channelId}_configUpdate.json`;
        const updatedConfigPbFile = `${cfg.CRYPTO_CONFIG_DIR}/${channelId}_configUpdate.pb`;
        const computedUpdatePbFileName = `${cfg.CRYPTO_CONFIG_DIR}/${channelId}_update.pb`;


        fs.writeFileSync(originalConfigJsonFile, JSON.stringify(originalConfig));
        this.translateProtobufConfig(TRANSLATE_OP.proto_encode, CONFIG_TYPE["common.Config"], originalConfigJsonFile, originalConfigPbFile);

        fs.writeFileSync(updatedConfigWithJsonFile, JSON.stringify(configWithChangesJson));
        this.translateProtobufConfig(TRANSLATE_OP.proto_encode, CONFIG_TYPE['common.Config'], updatedConfigWithJsonFile, updatedConfigPbFile);
        this.computeConfigUpdate(channelId, originalConfigPbFile, updatedConfigPbFile, computedUpdatePbFileName);

        return this.loadFileContentSync(computedUpdatePbFileName);
    }

    async prepareComputeUpdateEnvelope(channelId, originalConfig, configWithChangesJson) { //todo: for future reuse
        await this.computeChannelConfigUpdate(channelId, originalConfig, configWithChangesJson);

        const computedUpdatePbFileName = `${cfg.CRYPTO_CONFIG_DIR}/${channelId}_update.pb`;
        const computedUpdateJsonFile = `${cfg.CRYPTO_CONFIG_DIR}/${channelId}_update.json`;
        const updateEnvelopeJsonFile = `${cfg.CRYPTO_CONFIG_DIR}/${channelId}_update_envelope.json`;
        const updateEnvelopePbFile = `${cfg.CRYPTO_CONFIG_DIR}/${channelId}_update_envelope.pb`;


        this.translateProtobufConfig(TRANSLATE_OP.proto_decode, CONFIG_TYPE["common.ConfigUpdate"], computedUpdatePbFileName, computedUpdateJsonFile);
        let computedUpdate = this.loadFileContentSync(computedUpdateJsonFile);
        computedUpdate = JSON.parse(_.toString(computedUpdate));
        let envelope = JSON.stringify({
            payload: {
                header: {channel_header: {channel_id: channelId, type: 2}},
                data: {config_update: computedUpdate}
            }
        });
        fs.writeFileSync(updateEnvelopeJsonFile, envelope);
        this.translateProtobufConfig(TRANSLATE_OP.proto_encode, CONFIG_TYPE['common.Envelope'], updateEnvelopeJsonFile, updateEnvelopePbFile);

        return this.loadFileContentSync(updateEnvelopePbFile);
    }

    async prepareNewOrgConfig(newOrg) {
        return this.prepareOrgConfigStruct(newOrg, 'NewOrg.json', {NEWORG_PEER0_PORT: newOrg.peer0Port || cfg.DEFAULT_PEER0PORT, SIGNATURE_HASH_FAMILY: cfg.SIGNATURE_HASH_FAMILY})
    }

    async prepareNewConsortiumConfig(newOrg, consortiumName) {
        return this.prepareOrgConfigStruct(newOrg, 'Consortium.json', {CONSORTIUM_NAME: consortiumName || cfg.DEFAULT_CONSORTIUM, SIGNATURE_HASH_FAMILY: cfg.SIGNATURE_HASH_FAMILY})
    }

    async prepareOrgConfigStruct(newOrg, configTemplateFile, extraEnv) {
        await this.downloadOrgMSP(newOrg);

        let env = _.assign({
            NEWORG: newOrg.orgId,
            DOMAIN: cfg.domain,
        }, extraEnv);

        certsManager.forEachCertificate(newOrg, cfg.domain, (certificateSubDir, fullCertificateDirectoryPath, certificateFileName, directoryPrefixConfig) => {
            let certContent = this.loadFileContentSync(path.join(fullCertificateDirectoryPath, certificateFileName));
            env[directoryPrefixConfig.envVar] = Buffer.from(certContent).toString('base64');
        });
        /*
                    _.forEach(_.keys(CERT_FOLDERS_PREFIXES), certFolder => {
                    let certPrefix = CERT_FOLDERS_PREFIXES[certFolder];
                    let certFilePath = path.join(this.getCertFileDir(certFolder, cfg.orgCryptoConfigPath(newOrg)), this.getCertFileName(certPrefix, newOrg));
                    let certContent = this.loadFileContentSync(certFilePath);
                    env[certPrefix.envVar] = Buffer.from(certContent).toString('base64');
                });
        */

        const outputFile = `${cfg.CRYPTO_CONFIG_DIR}/${newOrg.orgId}_OrgConfig.json`;
        let newOrgSubstitution = await this.envSubst(`${cfg.TEMPLATES_DIR}/${configTemplateFile}`, outputFile, env);

        return {outputFile, outputJson: JSON.parse(newOrgSubstitution.outputContents)};
    }

    getCertFileDir(certFolder, domainCertPath) {
        return `${domainCertPath}/msp/${certFolder}`;
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

