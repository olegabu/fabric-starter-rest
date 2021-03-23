const _ = require('lodash');
const fabricCLI = require('$/fabric-cli');
const ctUtils= require('../component-manager-utils')
const cfg = require('$/config.js');
const util = require('$/util');

class PeerComponentType {

    async deployLocal(org, bootstrap, component, env) {

        let localEnv = ctUtils.envWithDockerComposeProjectName(env, cfg.org, component)
        if (!this.isMasterHost(org)) {
            util.writeHostFile({[org.masterIp]: `ca.${org.orgId}.${org.domain} peer0.${org.orgId}.${org.domain}`}) //TODO: peer0 -> peerName
            _.assign(localEnv, {CAS:`ca.${cfg.org}.${cfg.domain}:7054`, PEER_NAME: component.name, PEER0_PORT: component.peerPort, CORE_PEER_ADDRESS:}) //TODO: PEER0_PORT is to be renamed

        }
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


module.exports = new PeerComponentType()