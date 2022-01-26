const fs = require('fs-extra'),
    path = require('path'),
    dns = require('dns'),
    async = require('async'),
    nodeUtil = require('util'),
    _ = require('lodash'),
    envsub = require('envsub'),
    shell = require('shelljs'),
    Enum = require('enumify').Enum;

const cfg = require('./config')
const logger = cfg.log4js.getLogger('FabricCLI');
const certsManager = require('./certs-manager')
const mspManager = require('./service/msp/msp-manager');
const util = require('./util');
const streamUtils = require('./util/stream/streams')

const WGET_OPTS = process.env.WGET_OPTS || '-N';

class TRANSLATE_OP extends Enum {
}

TRANSLATE_OP.initEnum(['proto_encode', 'proto_decode', 'compute_update']);

class CONFIG_TYPE extends Enum {
}

CONFIG_TYPE.initEnum(['common.Config', 'common.Block', 'common.ConfigUpdate', 'common.Envelope']);

const dnsLookup = nodeUtil.promisify(dns.lookup)

class FabricCLI {

    async downloadCerts(orgName, domain, server, nameDomain, wwwPort, certsRootDir, wwwIp) {
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

            await this.downloadCertsFromWwwServer(orgName, domain, nameDomain, wwwIp, wwwPort, certsRootDir)
        } catch (err) {
            logger.error(`Cannot download certificates. Server not found ${wwwHost}`, err)
            throw new Error(`Cannot download certificates. Server not found ${wwwHost}`)
        }
    }

    async downloadCertsFromWwwServer(orgName, domain, nameDomain, wwwIp, wwwPort, certsRootDir) {
        if (!(_.isEqual(wwwIp, cfg.myIp) || _.startsWith(wwwIp, '172'))) {
            wwwPort = wwwPort || 80;
            await util.checkRemotePort(wwwIp, wwwPort); //TODO: same host orderer port is not available when in docker
            certsManager.forEachCertificate(orgName, domain, certsRootDir,
                (certificateSubDir, fullCertificateDirectoryPath, certificateFileName, directoryPrefixConfig) => {
                    logger.debug('Download CERTs: ', wwwIp, wwwPort)
                    shell.exec(`/usr/bin/wget ${WGET_OPTS} --directory-prefix ${fullCertificateDirectoryPath} http://${wwwIp}:${wwwPort}/node-certs/${nameDomain}/msp/${certificateSubDir}/${certificateFileName}`);
                });
        } else {
            logger.debug(`Skipping downloading certs. WwwIp: ${wwwIp}, myIp: ${cfg.myIp}`)
        }
    }

    // async downloadOrdererMSP(ordererName=cfg.ordererName, ordererDomain=cfg.ordererDomain, wwwPort = cfg.ordererWwwPort, ordererIp) {
    //     await this.downloadCerts(null, ordererDomain, ordererDomain, `${ordererName}.${ordererDomain}`, wwwPort, ordererIp);
    // }

    async downloadOrgMSP(orgObj, domain = cfg.domain, certsRootDir) {
        //TODO:await util.checkRemotePort(`www.${orgObj.orgId}.${domain}`, orgObj.wwwPort || 80);
        let orgId = _.get(orgObj, 'orgId');
        logger.debug(`Download MSP for org ${orgId}`, orgObj)
        await this.downloadCerts(orgId, domain, `${orgId}.${domain}`, `${orgId}.${domain}`, orgObj.wwwPort, certsRootDir);
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

    execPeerCommand(command, paramsStr, extraEnv, cb) {
        return this.execShellCommand(`peer ${command} -o ${cfg.ORDERER_ADDR} --tls --cafile ${cfg.ORDERER_TLS_CERT} ${paramsStr}`, null, extraEnv, cb);
    }

    async generateChannelConfigTx(channelId) {
        await this.envSubst(`${cfg.TEMPLATES_DIR}/configtx-template.yaml`, `${cfg.TMP_DIR}/configtx.yaml`, this.getEnv());

        const outputDir = `${cfg.TMP_DIR}/configtx`;
        await fs.ensureDir(outputDir)
        let outputTxFile = `${outputDir}/channel_${channelId}.tx`;
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
            RAFT0_CONSENTER_PORT: cfg.RAFT0_CONSENTER_PORT,
            RAFT1_CONSENTER_PORT: cfg.RAFT1_CONSENTER_PORT,
            RAFT2_CONSENTER_PORT: cfg.RAFT2_CONSENTER_PORT,
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
        const filePath = await this.fetchChannelConfig(channelId);
        return this.loadFileContent(filePath);
    }

    async fetchChannelConfig(channelId, extraEnv) {
        const channelConfigFile = `${channelId}_config.pb`;
        const outputFilePath = `${cfg.TMP_DIR}/${channelConfigFile}`;
        let out = await this.execPeerCommand(`channel fetch config ${outputFilePath}`, `-c ${channelId}`, extraEnv, async (err) => {
            if (err) {
                logger.error(`Error at fetching channel ${channelId} config: ${err}`)
            }
        });
        logger.debug(await streamUtils.streamToString(out))
        return outputFilePath;
    }

    async computeConfigUpdate(channelId, originalFileName, updatedFileName, outputFileName) {
        return new Promise((resolve, reject)=>{
            let result = this.execShellCommand(`configtxlator compute_update --channel_id=${channelId} --original=${originalFileName} --updated=${updatedFileName} --output=${outputFileName}`,
                null, null, (err) => {
                    return err ? reject(err) : resolve(result)
                });

        })
    }

    async translateProtobufConfig(translateOp, configType, inputFilename, outputFileName, cb) {
        return this.execShellCommand(`configtxlator ${translateOp.name} --type ${configType.name} --input=${inputFilename} --output=${outputFileName}`, null, null, cb);
    }

    async translateChannelConfig(configFileName) {
        logger.debug('translateChannelConfig ', configFileName)
        const rnd = Math.floor(Math.random() * 10000);
        const outputFileName = `${path.dirname(configFileName)}/${path.basename(configFileName, ".pb")}-${rnd}.json`;
        return new Promise(async (resolve, reject) => {
            let out = await this.translateProtobufConfig(TRANSLATE_OP.proto_decode, CONFIG_TYPE['common.Block'], configFileName, outputFileName,
                async (err) => {
                    if (err) {
                        return reject("Error translating protobuf: " + err)
                    }
                    const channelConfigProtobuf = await this.loadFileContent(outputFileName);
                    const channelConfigEnvelope = JSON.parse(_.toString(channelConfigProtobuf));
                    let origChannelGroupConfig = _.get(channelConfigEnvelope, "data.data[0].payload.data.config");
                    logger.debug('translateChannelConfig. result ', origChannelGroupConfig)

                    resolve(origChannelGroupConfig);
                });
            logger.debug(await streamUtils.streamToString(out))
        })
    }


    async computeChannelConfigUpdate(channelId, originalConfig, configWithChangesJson) {

        const originalConfigJsonFile = `${cfg.TMP_DIR}/${channelId}_originalConfig.json`;
        const originalConfigPbFile = `${cfg.TMP_DIR}/${channelId}_originalConfig.pb`;
        const updatedConfigWithJsonFile = `${cfg.TMP_DIR}/${channelId}_configUpdate.json`;
        const updatedConfigPbFile = `${cfg.TMP_DIR}/${channelId}_configUpdate.pb`;
        const computedUpdatePbFileName = `${cfg.TMP_DIR}/${channelId}_update.pb`;


        await fs.writeFile(originalConfigJsonFile, JSON.stringify(originalConfig));
        await this.translateProtobufConfig(TRANSLATE_OP.proto_encode, CONFIG_TYPE["common.Config"], originalConfigJsonFile, originalConfigPbFile);

        await fs.writeFile(updatedConfigWithJsonFile, JSON.stringify(configWithChangesJson));
        await this.translateProtobufConfig(TRANSLATE_OP.proto_encode, CONFIG_TYPE['common.Config'], updatedConfigWithJsonFile, updatedConfigPbFile);
        await this.computeConfigUpdate(channelId, originalConfigPbFile, updatedConfigPbFile, computedUpdatePbFileName);

        return await this.loadFileContent(computedUpdatePbFileName);
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

    async prepareOrgConfigStruct(newOrg, configTemplateFile, extraEnv, certFiles) {
        logger.debug("Prepare org config for ", newOrg)

        const orgMspPath = path.join(cfg.TMP_DIR, 'peerOrganizations', `${newOrg.orgId}.${newOrg.domain || cfg.domain}`);
        // await fs.emptyDir(orgMspPath);
        if (!certFiles) {
            try {
                await this.downloadOrgMSP(newOrg, newOrg.domain || cfg.domain, cfg.TMP_DIR);
            } catch (e) {
                logger.info("Can't download certificates. Skipping.")
            }
        } else {
            await async.everySeries(certFiles, async certFile => {
                await mspManager.unpackMsp(certFile, orgMspPath);
            })
        }

        let newOrgId = _.get(newOrg, 'orgId');
        let env = _.assign({
            NEWORG: newOrgId,
            DOMAIN: newOrg.domain || cfg.domain,
            PEER_NAME: newOrg.peerName || "peer0",
            SIGNATURE_HASH_FAMILY: cfg.SIGNATURE_HASH_FAMILY
        }, extraEnv);

        const origEnv = {
            DOMAIN: cfg.domain,
            PEER_NAME: cfg.peerName
        }
        certsManager.forEachCertificate(newOrgId, newOrg.domain || cfg.domain, cfg.TMP_DIR, (certificateSubDir, fullCertificateDirectoryPath, certificateFileName, directoryPrefixConfig) => {
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
        _.assign(process.env, origEnv); //TODO: envsub replaces global env!
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


    async loadFileContent(fileName) {
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

