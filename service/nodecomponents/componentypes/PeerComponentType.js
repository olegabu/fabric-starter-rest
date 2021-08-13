const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const fabricCLI = require('../../../fabric-cli');
const ctUtils = require('../component-manager-utils')
const cfg = require('../../../config.js');
const logger = cfg.log4js.getLogger('PeerComponentType');
const util = require('../../../util');
const archives = require('../../../service/archive-manager');
const Org = require("../../../model/Org");
const {OsnManager} = require('../../../osn-manager');
const remoteComponentRequest = require('../RemoteComponentRequest');
const mspManager = require('../../../service/msp/msp-manager');
const Files = require("../../../model/Files");
const Component = require("../../../model/Component");
const StreamConcatWaiting = require('../../../util/stream/stream-concat-waiting')


class PeerComponentType {

    constructor(fabricStarterRuntime) {
        this.fabricStarterRuntime = fabricStarterRuntime
    }

    async deployLocalPrimary(org, bootstrap, component, env) {
        const componentName = _.get(component, 'name')
        const peerPort = _.get(component, 'peerPort')
        cfg.setPeerName(componentName)

        env = ctUtils.envWithDockerComposeProjectName(env, cfg.org, componentName)

        let cmd = `docker-compose -f docker-compose.yaml -f docker-compose-couchdb.yaml -f docker-compose-ldap.yaml ${cfg.DOCKER_COMPOSE_EXTRA_ARGS} up `
            + ` -d --force-recreate --no-deps pre-install ca tlsca  www.local couchdb.peer peer cli.peer post-install `;//www.peer ldap-service ldapadmin //TODO: exclude ca, tlsca from here
        let upResult = fabricCLI.execShellCommand(cmd, cfg.YAMLS_DIR, env, () => {
        });
        await this.fabricStarterRuntime.setOrg(Org.fromConfig(cfg))//TODO: check if org is changed

        var stream = require('stream');
        var util = require('util');

        function DelayedStream() {//todo
            stream.Readable.call(this);
        }

        util.inherits(DelayedStream, stream.Readable);

        DelayedStream.prototype._read = function (obj) {
            // setTimeout(()=>{
            //     this.push(null)
            // }, 15000)
        };
        const delayedStream = new DelayedStream();

        const postInstallContainerName = `post-install.${cfg.peerName}.${cfg.org}.${cfg.domain}`;

        function waitLogStream(combinedStream, count) {
            try {
                if (count === 0) {
                    combinedStream.complete()
                    return
                }
                setTimeout(() => {
                    const cmd = `docker logs ${postInstallContainerName}`
                    let shellResult = fabricCLI.execShellCommand(cmd, cfg.YAMLS_DIR, env);
                    if (shellResult.isError()) {
                        waitLogStream(combinedStream, count - 1)
                    } else {
                        let logResult = fabricCLI.execShellCommand(`${cmd} -f`, cfg.YAMLS_DIR, env, () => {
                        });
                        combinedStream.add(logResult)
                    }
                }, 1000)
            } catch (e) {
                logger.debug('Command failed:', cmd, e)
            }
        }

        // const result = new ConcatStream([upResult]);
        // result.add(delayedStream)

        const result = new StreamConcatWaiting()
        result.addWithWait(upResult)
        cmd = `docker logs ${postInstallContainerName}`

        await result.waitFortStream(20, () => {
            let shellResult = fabricCLI.execShellCommand(cmd, cfg.YAMLS_DIR, env);
            if (!shellResult.isError()) {
                return fabricCLI.execShellCommand(`${cmd} -f`, cfg.YAMLS_DIR, env, () => {});
            }
        })

        // waitLogStream(result, 20)


        return result;
    }

    async deployLocalSecondary(org, bootstrap, component, env) {
        return await this.deployLocal(org, bootstrap, component, env)
    }

    async deployLocalJoined(org, bootstrap, component, env) {
        return this.deployLocalPrimary(org, bootstrap, component, env)
        /*
                env = ctUtils.envWithDockerComposeProjectName(env, cfg.org)
                let cmd = `docker-compose -f docker-compose.yaml -f docker-compose-couchdb.yaml -f docker-compose-ldap.yaml ${cfg.DOCKER_COMPOSE_EXTRA_ARGS} up `
                    + ` -d --force-recreate --no-deps pre-install ca tlsca www.local ldap-service ldapadmin couchdb.peer peer cli.peer post-install `;//www.peer
                let result = fabricCLI.execShellCommand(cmd, cfg.YAMLS_DIR, env);
                await util.sleep(4000)
                await this.fabricStarterRuntime.setOrg(Org.fromConfig(cfg))//TODO: check if org is changed
                return result;
        */
    }

    async deployLocalSecondaryJoined(org, bootstrap, component, env) {
        throw new Error('not implemented yet')
    }

    async deployLocal(org, bootstrap, component, env) {

        logger.debug('Deploying component', component)
        let ordererDomain = OsnManager.constructOrdererDomain(org, bootstrap)
        const componentName = _.get(component, 'values.name')
        const peerPort = _.get(component, 'values.peerPort')

        let localEnv = ctUtils.envWithDockerComposeProjectName(env, cfg.org, componentName)

        if (!this.isMasterHost(org)) {
            cfg.setPeerName(componentName)
            localEnv = _.assign(localEnv, {MASTER_IP: org.masterIp})
            util.writeHostFile({[org.masterIp]: `orderer.${ordererDomain} www.${ordererDomain} ca.${org.orgId}.${org.domain} tlsca.${org.orgId}.${org.domain} peer0.${org.orgId}.${org.domain}`}, cfg.CRYPTO_CONFIG_DIR) //TODO: peer0 -> peerName
            if (!_.isEmpty(component.files)) {
                await archives.extractUploadedArchive(component.files[0], cfg.ORG_CRYPTO_DIR, name => _.split(name, 'peer0').join(cfg.peerName)) //TODO: use master peerName
            }
            await fabricCLI.downloadOrdererMSP('orderer', ordererDomain, org.ordererWwwPort, org.ordererIp)//TODO: pass orderer in component config
        }

        await this.fabricStarterRuntime.setOrg(Org.fromConfig(cfg))//TODO: check if org is changed

        _.assign(localEnv, {
            CAS: `ca.${cfg.org}.${cfg.domain}:7054`, PEER_NAME: componentName, PEER0_PORT: peerPort,
            CORE_PEER_ADDRESS: `${componentName}.${org.orgId}.${org.domain}`
        }) //TODO: PEER0_PORT is to be renamed

        const defaultFabricStarterClient = this.fabricStarterRuntime.getDefaultFabricStarterClient();
        let enrollAdmin = await defaultFabricStarterClient.enroll('admin', cfg.enrollSecret);
        let adminMSPDir = path.join(cfg.ORG_CRYPTO_DIR, 'users', `Admin@${org.orgId}.${org.domain}`, 'msp');
        await fs.emptyDir(path.join(adminMSPDir, 'keystore'))
        await fs.outputFile(path.join(adminMSPDir, 'keystore', `${enrollAdmin.key.getSKI()}_sk`), enrollAdmin.key.toBytes(), {
            mode: 0o100400,
            encoding: 'binary'
        })
        await fs.emptyDir(path.join(adminMSPDir, 'signcerts'))
        await fs.outputFile(path.join(adminMSPDir, 'signcerts', `Admin@${org.orgId}.${org.domain}-cert.pem`), enrollAdmin.certificate, {encoding: 'binary'})

//        await this.fabricStarterRuntime.setOrg(Org.fromConfig(cfg))//TODO: check if org is changed


        let subjectName = `${componentName}.${cfg.org}.${cfg.domain}`;
        const peerDir = path.join(cfg.ORG_CRYPTO_DIR, 'peers', subjectName)
        const tlsFabricStarterClient = this.fabricStarterRuntime.getTLSFabricStarterClient();
        try {
            let tlsEnrollAdmin = await tlsFabricStarterClient.enroll('admin', cfg.enrollSecret);
            await tlsFabricStarterClient.register(subjectName, cfg.enrollSecret, cfg.org, 'peer')
        } catch (e) {
            console.log(e)
        }

        let enroll = await tlsFabricStarterClient.enroll(subjectName, cfg.enrollSecret, 'tls');
        let tlsDir = path.join(peerDir, 'tls');
        await fs.ensureDir(tlsDir)
        await fs.outputFile(path.join(tlsDir, 'server.crt'), enroll.certificate, {encoding: 'binary'})
        await fs.outputFile(path.join(tlsDir, 'server.key'), enroll.key.toBytes(), {mode: 0o100400, encoding: 'binary'})

        try {
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
        await fs.outputFile(path.join(keystoreDir, `${enroll.key.getSKI()}_sk`), enroll.key.toBytes(), {
            mode: 0o100400,
            encoding: 'binary'
        })

        let peerAdminDir = path.join(peerDir, 'msp', 'admincerts');
        await fs.emptyDir(peerAdminDir)
        await fs.outputFile(path.join(peerAdminDir, `Admin@${org.orgId}.${org.domain}-cert.pem`), enrollAdmin.certificate, {encoding: 'binary'})


        let cmd = `docker-compose -f docker-compose.yaml -f docker-compose-couchdb.yaml ${cfg.DOCKER_COMPOSE_EXTRA_ARGS} up `
            + ` -d --force-recreate --no-deps pre-install www.local couchdb.peer peer cli.peer post-install ` ;//www.peer`
        let upResult = fabricCLI.execShellCommand(cmd, cfg.YAMLS_DIR, localEnv, () => {
        });

        const postInstallContainerName = `post-install.${cfg.peerName}.${cfg.org}.${cfg.domain}`;

        const result = new StreamConcatWaiting()
        result.addWithWait(upResult)
        cmd = `docker logs ${postInstallContainerName}`

        await result.waitFortStream(20, () => {
            let shellResult = fabricCLI.execShellCommand(cmd, cfg.YAMLS_DIR, env);
            if (!shellResult.isError()) {
                return fabricCLI.execShellCommand(`${cmd} -f`, cfg.YAMLS_DIR, env, () => {});
            }
        })
        return result;

        /*        let peerResult = this.startPeerWithDockerCompose(env);
                await util.sleep(6000)
                await this.fabricStarterRuntime.tryInitRuntime(Org.fromConfig(cfg))

                return {
                    'www orderer': resultWww, 'integration request': configBlockStream, 'dns record': dnsResult,
                    'start orderer': resultOrderer, 'start peer': peerResult
                };*/
    }


    async deployRemote(org, bootstrap, component, env) {

        const remoteOrg = Org.fromOrg(org, {peerName: _.get(component, 'name')}) //TODO: pass ordererName\Domain ?
        component = await this.attachMspFileIfAbsent(component);
        const newVar = await remoteComponentRequest.requestRemoteComponentDeployment(remoteOrg, component);
        return newVar
    }

    isMasterHost(org) {
        return _.isEqual(org.orgIp, _.get(org, 'masterIp', org.orgIp));
    }

    async attachMspFileIfAbsent(component) {
        if (_.isEmpty(_.get(component, 'files'))) {
            const mspPackageStream = mspManager.packOrgPeerMsp();
            component = Component.fromComponent(component, null, [{
                fieldname: Files.componentFileName(component),
                filename: 'msp.tgz',
                stream: mspPackageStream
            }])
        }
        return component;
    }
}


module.exports = PeerComponentType