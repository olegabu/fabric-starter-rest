const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const fabricCLI = require('$/fabric-cli');
const ctUtils= require('../component-manager-utils')
const cfg = require('$/config.js');
const util = require('$/util');
const archives = require('$/service/archive-manager');
const Org = require("../../../model/Org");
const {OsnManager} = require('$/osn-manager');

class PeerComponentType {

    constructor(fabricStarterRuntime) {
        this.fabricStarterRuntime = fabricStarterRuntime
    }

    async deployLocal(org, bootstrap, component, env) {

        let ordererDomain = OsnManager.constructOrdererDomain(org, bootstrap)
        const componentName=_.get(component, 'values.name')
        const peerPort=_.get(component, 'values.peerPort')

        let localEnv = ctUtils.envWithDockerComposeProjectName(env, cfg.org, componentName)

        if (!this.isMasterHost(org)) {
            cfg.setPeerName(componentName)
            localEnv = _.assign(localEnv, {MASTER_IP: org.masterIp})
            util.writeHostFile({[org.masterIp]: `orderer.${ordererDomain} www.${ordererDomain} ca.${org.orgId}.${org.domain} tlsca.${org.orgId}.${org.domain} peer0.${org.orgId}.${org.domain}`}) //TODO: peer0 -> peerName
            if (!_.isEmpty(component.files)) {
                await archives.extractUploadedArchive(component.files[0], cfg.ORG_CRYPTO_DIR, name => _.split(name, 'peer0').join(cfg.peerName)) //TODO: use master peerName
            }
            await fabricCLI.downloadOrdererMSP('orderer', ordererDomain)//TODO: pass orderer in component config
        }

        await this.fabricStarterRuntime.setOrg(Org.fromConfig(cfg))//TODO: check if org is changed

        _.assign(localEnv, {CAS:`ca.${cfg.org}.${cfg.domain}:7054`, PEER_NAME: componentName, PEER0_PORT: peerPort,
            CORE_PEER_ADDRESS:`${componentName}.${org.orgId}.${org.domain}`}) //TODO: PEER0_PORT is to be renamed

        const defaultFabricStarterClient = this.fabricStarterRuntime.getDefaultFabricStarterClient();
        let enrollAdmin = await defaultFabricStarterClient.enroll('admin', cfg.enrollSecret);
        let adminMSPDir = path.join(cfg.ORG_CRYPTO_DIR, 'users', `Admin@${org.orgId}.${org.domain}`, 'msp');
        await fs.emptyDir(path.join(adminMSPDir, 'keystore'))
        await fs.outputFile(path.join(adminMSPDir, 'keystore', `${enrollAdmin.key.getSKI()}_sk`), enrollAdmin.key.toBytes(), {mode: 0o100400, encoding: 'binary'})
        await fs.emptyDir(path.join(adminMSPDir, 'signcerts'))
        await fs.outputFile(path.join(adminMSPDir, 'signcerts', `Admin@${org.orgId}.${org.domain}-cert.pem`), enrollAdmin.certificate, {encoding: 'binary'})

        await this.fabricStarterRuntime.setOrg(Org.fromConfig(cfg))//TODO: check if org is changed


        let subjectName = `${componentName}.${cfg.org}.${cfg.domain}`;
        const peerDir= path.join(cfg.ORG_CRYPTO_DIR, 'peers', subjectName)
        const tlsFabricStarterClient = this.fabricStarterRuntime.getTLSFabricStarterClient();
        try {
            await tlsFabricStarterClient.register(subjectName, cfg.enrollSecret, cfg.org, 'peer')
        } catch (e) {
            console.log(e)
        }

        let enroll = await tlsFabricStarterClient.enroll(subjectName, cfg.enrollSecret, 'tls');
        let tlsDir = path.join(peerDir, 'tls');
        await fs.ensureDir(tlsDir)
        await fs.outputFile(path.join(tlsDir, 'server.crt'), enroll.certificate, {encoding: 'binary'})
        await fs.outputFile(path.join(tlsDir, 'server.key'), enroll.key.toBytes(), {mode: 0o100400, encoding: 'binary'})

        try{
            await defaultFabricStarterClient.register(subjectName, cfg.enrollSecret, cfg.org, 'peer')
        } catch (e) {
            console.log(e)
        }

        enroll = await defaultFabricStarterClient.enroll(subjectName, cfg.enrollSecret);

        let signCertDir = path.join(peerDir, 'msp', 'signcerts');
        await fs.emptyDir(signCertDir)
        await fs.outputFile(path.join(signCertDir, `${subjectName}-cert.pem`), enroll.certificate, {encoding: 'binary'})

        let keystoreDir = path.join(peerDir, 'msp', 'keystore');
        await fs.emptyDir(keystoreDir)
        await fs.outputFile(path.join(keystoreDir, `${enroll.key.getSKI()}_sk`), enroll.key.toBytes(), {mode: 0o100400, encoding: 'binary'})

        let peerAdminDir = path.join(peerDir, 'msp', 'admincerts');
        await fs.emptyDir(peerAdminDir)
        await fs.outputFile(path.join(peerAdminDir, `Admin@${org.orgId}.${org.domain}-cert.pem`), enrollAdmin.certificate, {encoding: 'binary'})


        let cmd = `docker-compose -f docker-compose.yaml -f docker-compose-couchdb.yaml ${cfg.DOCKER_COMPOSE_EXTRA_ARGS} up `
            + ` -d --force-recreate --no-deps pre-install www.local couchdb.peer peer cli.peer post-install `;//www.peer
        let result = fabricCLI.execShellCommand(cmd, cfg.YAMLS_DIR, localEnv);
        return result;
    }

    async deployRemote(org, bootstrap, component, env) {

        env = ctUtils.envWithDockerComposeProjectName(env, cfg.org)

        let cmd = `docker-compose -f docker-compose.yaml -f docker-compose-couchdb.yaml ${cfg.DOCKER_COMPOSE_EXTRA_ARGS} up `
            + ` -d --force-recreate --no-deps pre-install www.local couchdb.peer peer cli.peer post-install `;//www.peer
        let result = fabricCLI.execShellCommand(cmd, cfg.YAMLS_DIR, env);
        return result;
    }

    isMasterHost(org) {
        return _.isEqual(org.orgIp, _.get(org, 'masterIp', org.orgIp));
    }

}


module.exports = PeerComponentType