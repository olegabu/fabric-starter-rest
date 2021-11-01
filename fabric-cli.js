const fs = require('fs'),
    path = require('path'),
    dns = require('dns'),
    nodeUtil = require('util'),
    _ = require('lodash'),
    envsub = require('envsub'),
    shell = require('shelljs'),
    Enum = require('enumify').Enum;

const cfg = require('./config')
const logger = cfg.log4js.getLogger('FabricCLI');
const certsManager = require('./certs-manager')
const util = require('./util');


const WGET_OPTS = process.env.WGET_OPTS || '-N';

class TRANSLATE_OP extends Enum {
}

TRANSLATE_OP.initEnum(['proto_encode', 'proto_decode', 'compute_update']);

class CONFIG_TYPE extends Enum {
}

CONFIG_TYPE.initEnum(['common.Config', 'common.Block', 'common.ConfigUpdate', 'common.Envelope']);

const dnsLookup = nodeUtil.promisify(dns.lookup)

class FabricCLI {

    async downloadCerts(orgName, domain, server, nameDomain, wwwPort, wwwIp) {
        // const orgDomain = orgName ? `${orgName}.${domain}` : domain;

        let wwwHost = wwwIp

        try {
            if (!wwwIp) {
                wwwHost = `www.${server}`;
                let dnsInfo = await dnsLookup(wwwHost, 4);
                wwwIp = dnsInfo.address
            }


/*            if (!_.isEqual(wwwIp, cfg.myIp) && !_.startsWith(wwwIp, '172')) {
                wwwPort = wwwPort || 80;
                await util.checkRemotePort(wwwHost, wwwPort); //TODO: same host orderer port is not available when in docker
                certsManager.forEachCertificate(orgName, domain,
                    (certificateSubDir, fullCertificateDirectoryPath, certificateFileName, directoryPrefixConfig) => {
                        shell.exec(`/usr/bin/wget ${WGET_OPTS} --directory-prefix ${fullCertificateDirectoryPath} http://${wwwHost}:${wwwPort || 80}/node-certs/${nameDomain}/msp/${certificateSubDir}/${certificateFileName}`);
                    });
            }*/

            await this.downloadCertsFromWwwServer(orgName, domain, nameDomain, wwwIp, wwwPort)
        } catch(err) {
            logger.error(`Download certificates. Server not found ${wwwHost}`)
            throw new Error(`Download certificates. Server not found ${wwwHost}`)
        }
    }

    async downloadCertsFromWwwServer(orgName, domain, nameDomain, wwwIp, wwwPort) {
        if (!(_.isEqual(wwwIp, cfg.myIp) || _.startsWith(wwwIp, '172'))) {
            wwwPort = wwwPort || 80;
            await util.checkRemotePort(wwwIp, wwwPort); //TODO: same host orderer port is not available when in docker
            certsManager.forEachCertificate(orgName, domain,
                (certificateSubDir, fullCertificateDirectoryPath, certificateFileName, directoryPrefixConfig) => {
                    shell.exec(`/usr/bin/wget ${WGET_OPTS} --directory-prefix ${fullCertificateDirectoryPath} http://${wwwIp}:${wwwPort}/node-certs/${nameDomain}/msp/${certificateSubDir}/${certificateFileName}`);
                });
        } else {
            logger.debug(`Skipping downloading certs. WwwIp: ${wwwIp}, myIp: ${cfg.myIp}`)
        }
    }

    // async downloadOrdererMSP(ordererName=cfg.ordererName, ordererDomain=cfg.ordererDomain, wwwPort = cfg.ordererWwwPort, ordererIp) {
    //     await this.downloadCerts(null, ordererDomain, ordererDomain, `${ordererName}.${ordererDomain}`, wwwPort, ordererIp);
    // }

    async downloadOrgMSP(orgObj, domain = cfg.domain) {
        //TODO:await util.checkRemotePort(`www.${orgObj.orgId}.${domain}`, orgObj.wwwPort || 80);
        let orgId = _.get(orgObj, 'orgId');
        logger.debug(`Download MSP for org ${orgId}`, orgObj)
        await this.downloadCerts(orgId, domain,`${orgId}.${domain}`, `${orgId}.${domain}`, orgObj.wwwPort);
    }

    execShellCommand(cmd, dir, extraEnv, callback) {
        const env = _.assign({}, process.env, this.getEnv(), extraEnv || {});
        const opts = {env: env};
        if (dir) {
            cmd = `cd ${dir}; ${cmd}`;
        }
        logger.info('Executing shell command:', cmd);
        let execResult = shell.exec(`${cmd} 2>&1`, opts, callback);

        if (callback) { //todo: refactor out to different function
            return execResult.stdout;
        }

        logger.info("Exit code:", _.get(execResult, 'code'), ". Cmd:", cmd);

        const code = _.get(execResult, 'code');
        const output = util.splitOutputToMultiline(_.get(execResult, 'stdout'))
        logger.debug(output);

        const result = {
            status: code === 0 ? 'success' : 'error',
            cmd: cmd,
            code: code,
            output: output,
            env: util.sortAndFilterObjectProps(env, entry => !_.startsWith(_.get(entry, '[0]'), 'npm_')),
            isError: () => code !== 0
        };
        if (code !== 0) {
            logger.error(`Shell execution error: ${result.cmd}, ${result.output}`)
            logger.error(result.env)
        }
        return result;
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
        this.execShellCommand(`peer ${command} -o ${cfg.ORDERER_ADDR} --tls --cafile ${cfg.ORDERER_TLS_CERT} ${paramsStr}`, null, extraEnv);
    }

    async generateChannelConfigTx(channelId) {
        await this.envSubst(`${cfg.TEMPLATES_DIR}/configtx-template.yaml`, `${cfg.TMP_DIR}/configtx.yaml`, this.getEnv());

        let outputTxFile = `${cfg.TMP_DIR}/configtx/channel_${channelId}.tx`;
        this.generateConfigTxForChannel(channelId, cfg.TMP_DIR, "CHANNEL", outputTxFile);
        return outputTxFile;
    }

    createChannelByCli(channelName) {
        let arg = ` -c ${channelName} -f ${cfg.TMP_DIR}/configtx/channel_${channelName}.tx `;
        this.execPeerCommand('channel create', arg);
    }

    getEnv(extraEnv) {
        return _.assign({
            DOMAIN: cfg.domain,
            ORG: cfg.org,
            PEER_NAME: cfg.peerName,
            PEER0_PORT: cfg.peer0Port,
            ORDERER_NAME: cfg.ordererName,
            ORDERER_DOMAIN: cfg.ordererDomain,
            ORDERER_NAME_PREFIX: cfg.ORDERER_NAME_PREFIX,
            ORDERER_BATCH_TIMEOUT: cfg.ORDERER_BATCH_TIMEOUT,
            ORDERER_GENERAL_LISTENPORT: cfg.ordererPort,
            RAFT0_PORT: cfg.RAFT0_PORT,
            RAFT1_PORT: cfg.RAFT1_PORT,
            RAFT2_PORT: cfg.RAFT2_PORT,
            MY_IP: cfg.myIp,
            ORDERER_ADDR: cfg.ORDERER_ADDR,
            ORDERER_TLS_CERT: cfg.ORDERER_TLS_CERT,
            FABRIC_STARTER_HOME: cfg.FABRIC_STARTER_HOME,
            BOOTSTRAP_SERVICE_URL: cfg.BOOTSTRAP_SERVICE_URL,
            BOOTSTRAP_IP: cfg.bootstrapIp,
            BOOTSTRAP_EXTERNAL_PORT: cfg.BOOTSTRAP_EXTERNAL_PORT,
            CORE_PEER_MSPCONFIGPATH: cfg.CORE_PEER_MSPCONFIGPATH,
            CORE_PEER_LOCALMSPID: cfg.CORE_PEER_LOCALMSPID,
            FABRIC_STARTER_VERSION: cfg.FABRIC_STARTER_VERSION,
            FABRIC_VERSION: cfg.FABRIC_VERSION,
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
        const outputFilePath = `${cfg.TMP_DIR}/${channelConfigFile}`;
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
        logger.debug('translateChannelConfig ', configFileName)
        const outputFileName = `${path.dirname(configFileName)}/${path.basename(configFileName, ".pb")}.json`;
        this.translateProtobufConfig(TRANSLATE_OP.proto_decode, CONFIG_TYPE['common.Block'], configFileName, outputFileName);
        const channelConfigProtobuf = this.loadFileContentSync(outputFileName);
        const channelConfigEnvelope = JSON.parse(_.toString(channelConfigProtobuf));
        let origChannelGroupConfig = _.get(channelConfigEnvelope, "data.data[0].payload.data.config");
        logger.debug('translateChannelConfig. result ', origChannelGroupConfig)
        return origChannelGroupConfig;
    }


    computeChannelConfigUpdate(channelId, originalConfig, configWithChangesJson) {

        const originalConfigJsonFile = `${cfg.TMP_DIR}/${channelId}_originalConfig.json`;
        const originalConfigPbFile = `${cfg.TMP_DIR}/${channelId}_originalConfig.pb`;
        const updatedConfigWithJsonFile = `${cfg.TMP_DIR}/${channelId}_configUpdate.json`;
        const updatedConfigPbFile = `${cfg.TMP_DIR}/${channelId}_configUpdate.pb`;
        const computedUpdatePbFileName = `${cfg.TMP_DIR}/${channelId}_update.pb`;


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
        logger.debug("Prepare org config for ", newOrg)
        await this.downloadOrgMSP(newOrg);

        let newOrgId = _.get(newOrg,'orgId');
        let env = _.assign({
            NEWORG: newOrgId,
            DOMAIN: cfg.domain,
        }, extraEnv);

        certsManager.forEachCertificate(newOrgId, newOrg.domain || cfg.domain, (certificateSubDir, fullCertificateDirectoryPath, certificateFileName, directoryPrefixConfig) => {
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

        const outputFile = `${cfg.TMP_DIR}/${newOrgId}_OrgConfig.json`;
        let newOrgSubstitution = await this.envSubst(`${cfg.TEMPLATES_DIR}/${configTemplateFile}`, outputFile, env);
        logger.debug('Config for ', newOrg, JSON.parse(newOrgSubstitution.outputContents))
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

    packageChaincodeWithInstantiationPolicy(chaincodeId, chaincodePath, version, language, instantiationPolicy) {
        const instantiationPolicyParam = instantiationPolicy ? `-i ${instantiationPolicy}` : `-i "AND('${cfg.org}.admin')"`;
        let packageFileName = `${cfg.CRYPTO_CONFIG_DIR}/chaincode-${cfg.org}_${chaincodeId}.package`;
        const peerPackageCommandArgs = ` -n ${chaincodeId} -p ${chaincodePath} -v ${version} -l ${language} ${instantiationPolicyParam} -s -S ${packageFileName}`
        this.execPeerCommand('chaincode package', peerPackageCommandArgs);
        return packageFileName;
    }
}


module.exports = new FabricCLI();

