const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const async = require('async');
const cfg = require('$/config.js');
const logger = cfg.log4js.getLogger('NodeComponentsManager');
const util = require('$/util');
const fabricCLI = require('$/fabric-cli');
const httpsService = require('$/service/http-service');
const Org = require("$/model/Org");
const Raft3ComponentType = require("./componentypes/Raft3ComponentType");
const FabricCAComponentType = require("./componentypes/FabricCAComponentType");
const PeerComponentType = require("./componentypes/PeerComponentType");

const COMPONENT_DEPLOYERS = {
    'RAFT3': Raft3ComponentType,
    'FabricCA': FabricCAComponentType,
    'PEER': PeerComponentType,
}

class NodeComponentsManager {

    constructor(fabricStarterRuntime) {
        this.fabricStarterRuntime = fabricStarterRuntime
    }

    setOrgConfig(org, enroll) {
        cfg.setOrg(org.orgId)
        cfg.setDomain(org.domain)
        cfg.setOrdererDomain(org.domain)
        cfg.setMyIp(org.orgIp)
        cfg.setMasterIp(org.masterIp)
        cfg.setEnrollSecret(enroll.enrollSecret)
    }

    async deployTopology(org, enroll, bootstrap, topology, env) {
        this.setOrgConfig(org, enroll)
        await async.eachSeries(topology, async component => {
            const componentDeployer = this.getDeployer(component);
            if (componentDeployer) {
                if (this.isTargetSameHost(org, component)) {
                    await componentDeployer.deployLocal(org, bootstrap, component)
                } else {
                    await componentDeployer.deployRemote(org, bootstrap, component)
                }
            }
            await util.sleep(4000);
        })/*.catch(err => {
            logger.error('Error deploying topology:', topology, err)
            throw new Error('Error deploying topology:', topology)
        })*/

        await this.fabricStarterRuntime.tryInitRuntime(Org.fromConfig(cfg))

    }

    isTargetSameHost(org, component) {
        return _.isEqual(org.orgIp, _.get(component, 'componentIp', org.orgIp));
    }

    getDeployer(component) {
        const componentDeployer = COMPONENT_DEPLOYERS[component.componentType]
        return componentDeployer;
    }

    async startupNode(env) {
        if (_.get(env, 'ORDERER_NAME')) cfg.setOrdererName(env.ORDERER_NAME)
        if (_.get(env, 'ORDERER_DOMAIN')) cfg.setOrdererDomain(env.ORDERER_DOMAIN)

        let {env: actualEnv, ...resultOrderer} = this.startUpOrdererService(env);
        let peerResult = ''

        if (!resultOrderer.isError()) {
            await util.sleep(2000)
            if (env.ORDERER_TYPE === 'RAFT') {
                env.ORDERER_NAMES = `${cfg.ordererName}:${cfg.ordererPort},raft1:7150,raft2:7250`
            }
            peerResult = this.startPeerWithDockerCompose(env);
            await this.fabricStarterRuntime.tryInitRuntime(Org.fromConfig(cfg))
            return {StartOrderer: resultOrderer, /*DeleteWWW: deleteResult,*/ StartPeer: peerResult}
        }
        return {StartOrderer: {...resultOrderer, actualEnv}}
    }

    startUpOrdererService(env) {
        env = envWithDockerComposeProjectName(env)
        let resultOrderer = fabricCLI.execShellCommand("/bin/bash ./ordering-start.sh", cfg.YAMLS_DIR, env);
        return resultOrderer;
    }

    async joinNode(env) {
        cfg.setOrdererDomain(env.ORDERER_DOMAIN)
        env = envWithDockerComposeProjectName(env)
        let result = this.startOrdererWithDockerCompose('www.orderer pre-install', env)
        let {env: wwwEnv, ...resultWww} = result

        await util.checkRemotePort(cfg.myIp, cfg.ordererWwwPort, {
            timeout: 2000, from: 'joinOrderer'
        })

        let configBlockStream = await this.requestIntegrationToBootstrapNode(env);
        let genesisFilePath = path.join(cfg.CRYPTO_CONFIG_DIR, 'configtx', cfg.ordererDomain, 'genesis.pb');
        logger.debug('Piping result config block to ', genesisFilePath)
        fs.ensureFileSync(genesisFilePath)
        fs.removeSync(genesisFilePath)
        fs.writeFileSync(genesisFilePath, configBlockStream, {encoding: 'binary'})

        let dnsResult = this.updateDnsFile(env);

        // await this.downloadOrdererGenesisBlock(env)
        let resultStart = this.startOrdererWithDockerCompose('orderer cli.orderer', env)
        let {env: ordEnv, ...resultOrderer} = resultStart

        await util.sleep(5000)
        let peerResult = this.startPeerWithDockerCompose(env);
        await util.sleep(6000)
        await this.fabricStarterRuntime.tryInitRuntime(Org.fromConfig(cfg))

        return {
            'www orderer': resultWww, 'integration request': configBlockStream, 'dns record': dnsResult,
            'start orderer': resultOrderer, 'start peer': peerResult
        };
    }

    cleanupNode(env) {
        const containerList = `${cfg.peerName}.${cfg.org}.${cfg.domain} ca.${cfg.org}.${cfg.domain} cli.${cfg.org}.${cfg.domain} post-install.${cfg.org}.${cfg.domain} `
            + ` couchdb.${cfg.peerName}.${cfg.org}.${cfg.domain} ldap.${cfg.org}.${cfg.domain} ldapadmin.${cfg.org}.${cfg.domain} `
            + ` ${cfg.ordererName}.${cfg.ordererDomain} cli.${cfg.ordererName}.${cfg.ordererDomain} raft1.${cfg.ordererDomain} raft2.${cfg.ordererDomain}`
            + ` www.${cfg.ordererDomain} www.${cfg.org}-${cfg.domain} cli.${cfg.ordererName}.${cfg.org}-${cfg.domain} ${cfg.ordererName}.${cfg.org}-${cfg.domain}`
            + `dev-${cfg.peerName}.${cfg.org}.${cfg.domain}-${cfg.DNS_CHAINCODE}-1.0`
        let result = this.deleteContainers(containerList, env);
        fs.writeFileSync(path.join(cfg.CRYPTO_CONFIG_DIR, 'hosts'), `#Renewed on deleting containers at ${new Date()}`)
        return result
    }

    updateDnsFile(env) {
        let remoteOrdererDomain = `${env.REMOTE_ORDERER_DOMAIN || cfg.domain}`;
        const dnsRecord = `${env.BOOTSTRAP_IP} orderer.${remoteOrdererDomain} raft1.${remoteOrdererDomain} raft2.${remoteOrdererDomain}`
        logger.debug('Append dns record ', dnsRecord)
        fs.appendFileSync(path.join(cfg.CRYPTO_CONFIG_DIR, 'hosts'), `\n#add orderer ${remoteOrdererDomain} ${new Date()} \n${dnsRecord}`)
        return dnsRecord
    }

    async requestIntegrationToBootstrapNode(env) {
        const integrationUrl = `${cfg.BOOTSTRAP_SERVICE_URL}://${env.BOOTSTRAP_IP}:${env.BOOTSTRAP_EXTERNAL_PORT || cfg.API_PORT}/integration/service/raft`
        const orderer = {
            ordererName: cfg.ordererName, "domain": env.ORDERER_DOMAIN, ordererPort: cfg.ordererPort,
            wwwPort: cfg.ordererWwwPort, ordererIp: cfg.myIp, orgId: cfg.org
        }
        logger.debug('Integration request:', integrationUrl, orderer)
        let stream = await httpsService.post(integrationUrl, orderer, {headers: {accept: 'application/octet-stream'}})
        logger.debug('Integration answer:', stream)
        return stream;
    }

    startPeerWithDockerCompose(env) {
        env = envWithDockerComposeProjectName(env)
        let cmd = `docker-compose -f docker-compose.yaml -f docker-compose-couchdb.yaml -f docker-compose-ldap.yaml ${cfg.DOCKER_COMPOSE_EXTRA_ARGS} up `
            + ` -d --force-recreate --no-deps pre-install ca  www.local ldap-service ldapadmin couchdb.peer peer cli.peer post-install `;//www.peer
        let result = fabricCLI.execShellCommand(cmd, cfg.YAMLS_DIR, env);
        return result;
    }

    startOrdererWithDockerCompose(dockerComposeServices, env) {
        let cmd = `docker-compose -f docker-compose-orderer.yaml -f docker-compose-orderer-domain.yaml -f docker-compose-orderer-ports.yaml up -d ${dockerComposeServices}`
        let result = fabricCLI.execShellCommand(cmd, cfg.YAMLS_DIR, env);
        return result;
    }

    deleteContainers(containersList, env) {
        env = envWithDockerComposeProjectName(env)
        let cmd = `docker rm -fv ${containersList}`
        return fabricCLI.execShellCommand(cmd, cfg.YAMLS_DIR, env);
    }

    async downloadOrdererGenesisBlock(remoteAddr) {
        return httpsService.download(`http://${remoteAddr}/msp/${cfg.ordererName}.${cfg.ordererDomain}/genesis/${cfg.systemChannelId}_remote.pb`)
        /*
        wget ${WGET_OPTS} --directory-prefix crypto-config/configtx http://${REMOTE_WWW_ADDR}/msp/${ORDERER_NAME}.${ORDERER_DOMAIN}/genesis/${SYSTEM_CHANNEL}_remote.pb
            cp crypto-config/configtx/${SYSTEM_CHANNEL}_remote.pb crypto-config/configtx/${ORDERER_DOMAIN}/genesis.pb
*/

    }
}

function envWithDockerComposeProjectName(env) {
    let fullEnv = _.assign({COMPOSE_PROJECT_NAME: cfg.org}, env)
    logger.debug("Full env:", fullEnv);
    return fullEnv;
}

module.exports = NodeComponentsManager