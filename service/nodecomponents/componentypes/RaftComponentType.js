const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const fabricCLI = require('../../../fabric-cli');
const cfg = require('../../../config.js');
const logger = cfg.log4js.getLogger('RaftComponentType');
const httpsService = require('../../../service/http/http-service');
const {OsnManager} = require('../../../osn-manager');
const util = require('../../../util')
const ctUtils = require('../component-manager-utils')

class RaftComponentType {

    constructor(fabricStarterRuntime) {
        this.fabricStarterRuntime = fabricStarterRuntime
    }

    async deployLocalPrimary(org, bootstrap, component) {
        throw new Error('not implemented yet')
    }

    async deployLocalSecondary(org = {}, bootstrap = {}, component) {//TODO: haven't done
        await this.deployLocal(org, bootstrap, component)

        await util.checkRemotePort(cfg.myIp, cfg.ordererWwwPort, {
            timeout: 2000, from: 'RaftComponentType:deployLocal'
        })
        let result = await this.integrateToRemoteOSNService(org.masterIp, cfg.API_PORT, {}, ()=>{});
        return result
    }

    async deployLocalJoined(org = {}, bootstrap = {}, component, env) {
        env = ctUtils.envWithDockerComposeProjectName(env, cfg.org)

        await this.deployLocal(org, bootstrap, component, env)

        await util.checkRemotePort(cfg.myIp, cfg.ordererWwwPort, {
            timeout: 2000, from: 'RaftComponentType:deployLocal'
        })
        await this.updateDnsInfo(bootstrap.ip, bootstrap.remoteOrdererDomain || cfg.domain);
        let result = await this.integrateToRemoteOSNService(bootstrap.ip, bootstrap.bootstrapCommunicationPort || cfg.BOOTSTRAP_EXTERNAL_PORT, env, ()=>{});
        return result
    }

    async deployLocalSecondaryJoined(org, bootstrap, component, env) {
        throw new Error('not implemented yet')
    }


    async integrateToRemoteOSNService(remoteIntegrationIP, remoteIntegrationPort, env, callback) {
        if (remoteIntegrationIP) {//TODO: if empty, are we trying to start another instance of raft server
            let configBlockStream = await this.requestIntegrationToBootstrapNode(remoteIntegrationIP, remoteIntegrationPort, env);
            let genesisFilePath = path.join(cfg.CRYPTO_CONFIG_DIR, 'configtx', cfg.ordererDomain, 'genesis.pb');
            logger.debug('Piping result config block to ', genesisFilePath)
            fs.ensureFileSync(genesisFilePath)
            fs.removeSync(genesisFilePath)
            fs.writeFileSync(genesisFilePath, configBlockStream, {encoding: 'binary'})

            // await this.downloadOrdererGenesisBlock(env)
            let resultStart = this.startOrdererWithDockerCompose('orderer cli.orderer', env, callback)
            let {env: ordEnv, ...resultOrderer} = resultStart

            await util.sleep(5000)
            return resultStart
        }
    }


    async deployLocal(org, bootstrap, component, env = {}) {
        env = ctUtils.envWithDockerComposeProjectName(env, cfg.org)

        cfg.setOrdererDomain(_.get(component, 'values.ORDERER_DOMAIN', _.get(component, 'ordererDomain')) || OsnManager.constructOrdererDomain(org, bootstrap)) //todo: move to Orderer model
        let result = this.startOrdererWithDockerCompose('www.orderer pre-install', env)
        return result
    }

    async targetIsLocalSecondaryJoiningHost() {
        throw new Error('not implemented yet')
    }

    async targetIsRemoteSecondaryHost() {
        throw new Error('not implemented yet')
    }

    async deployRemote(org, bootstrap, component, env) {
        throw new Error('Remote deploymenet for Raft3 is not implemented yet')
    }

    startOrdererWithDockerCompose(dockerComposeServices, env, callback) {
        let cmd = `docker-compose -f docker-compose-orderer.yaml -f docker-compose-orderer-domain.yaml -f docker-compose-orderer-ports.yaml up -d ${dockerComposeServices}`
        let result = fabricCLI.execShellCommand(cmd, cfg.YAMLS_DIR, env, callback);
        return result;
    }

    async requestIntegrationToBootstrapNode(remoteIntegrationIP, remoteIntegrationPort, env) {
        const integrationUrl = `${cfg.BOOTSTRAP_SERVICE_URL}://${remoteIntegrationIP}:${remoteIntegrationPort || cfg.API_PORT}/integration/service/raft`
        const orderer = {
            ordererName: cfg.ordererName, "domain": cfg.ordererDomain, ordererPort: cfg.ordererPort,
            wwwPort: cfg.ordererWwwPort, ordererIp: cfg.myIp, orgId: cfg.org
        }
        logger.debug('Integration request:', integrationUrl, orderer)
        let stream = await httpsService.post(integrationUrl, orderer, {headers: {accept: 'application/octet-stream'}})
        logger.debug('Integration answer:', stream)
        return stream;
    }

    updateDnsInfo(remoteIp, remoteOrdererDomain) {
        util.writeHostFile({[remoteIp]: `orderer.${remoteOrdererDomain} raft1.${remoteOrdererDomain} raft2.${remoteOrdererDomain}`})
    }
}


module.exports = RaftComponentType