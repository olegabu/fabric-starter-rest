const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const fabricCLI = require('$/fabric-cli');
const ctUtils= require('../component-manager-utils')
const cfg = require('$/config.js');
const util = require('$/util');

class PeerComponentType {

    constructor(fabricStarterRuntime) {
        this.fabricStarterRuntime = fabricStarterRuntime
    }

    async deployLocal(org, bootstrap, component, env) {

        let localEnv = ctUtils.envWithDockerComposeProjectName(env, cfg.org, component)
        if (!this.isMasterHost(org)) {
            util.writeHostFile({[org.masterIp]: `ca.${org.orgId}.${org.domain} tlsca.${org.orgId}.${org.domain} peer0.${org.orgId}.${org.domain}`}) //TODO: peer0 -> peerName

        }
        _.assign(localEnv, {CAS:`ca.${cfg.org}.${cfg.domain}:7054`, PEER_NAME: component.name, PEER0_PORT: component.peerPort,
            CORE_PEER_ADDRESS:`${localEnv.PEER_NAME}.${org.orgId}.${org.domain}`}) //TODO: PEER0_PORT is to be renamed

        let subjectName = `${component.name}.${cfg.org}.${cfg.domain}`;
        const tlsFabricStarterClient = this.fabricStarterRuntime.getTLSFabricStarterClient();
        await tlsFabricStarterClient.register(subjectName, cfg.enrollSecret, cfg.org, 'peer')

        let enroll = await tlsFabricStarterClient.enroll(subjectName, cfg.enrollSecret, 'tls');
        const peerDir= path.join(cfg.ORG_CRYPTO_DIR, 'peers', subjectName)
        let tlsDir = path.join(peerDir, 'tls');
        await fs.ensureDir(tlsDir)
        await fs.outputFile(path.join(tlsDir, 'server.crt'), enroll.certificate, {encoding: 'binary'})
        await fs.outputFile(path.join(tlsDir, 'server.key'), enroll.key.toBytes(), {mode: 0o100400, encoding: 'binary'})

        const defaultFabricStarterClient = this.fabricStarterRuntime.getDefaultFabricStarterClient();
        let res= await defaultFabricStarterClient.register(subjectName, cfg.enrollSecret, cfg.org, 'peer')
        enroll = await defaultFabricStarterClient.enroll(subjectName, cfg.enrollSecret);

        let signCertDir = path.join(peerDir, 'msp', 'signcerts');
        await fs.emptyDir(signCertDir)
        await fs.outputFile(path.join(signCertDir, `${subjectName}-cert.pem`), enroll.certificate, {encoding: 'binary'})

        let keystoreDir = path.join(peerDir, 'msp', 'keystore');
        await fs.emptyDir(keystoreDir)
        await fs.outputFile(path.join(keystoreDir, `${enroll.key.getSKI()}_sk`), enroll.key.toBytes(), {mode: 0o100400, encoding: 'binary'})


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