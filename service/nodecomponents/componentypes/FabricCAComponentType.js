const _ = require('lodash');
const fabricCLI = require('$/fabric-cli');
const ctUtils = require('../component-manager-utils')
const cfg = require('$/config.js');

class FabricCAComponentType {

    constructor(fabricStarterRuntime) {
        this.fabricStarterRuntime = fabricStarterRuntime
    }

    async deployLocalPrimary(org, bootstrap, component, env) {

        env = ctUtils.envWithDockerComposeProjectName(env, cfg.org)

        let cmd = `docker-compose -f docker-compose.yaml -f docker-compose-ldap.yaml ${cfg.DOCKER_COMPOSE_EXTRA_ARGS} up `
            + ` -d --force-recreate --no-deps pre-install ca tlsca ldap-service ldapadmin `
        let result = fabricCLI.execShellCommand(cmd, cfg.YAMLS_DIR, env, ()=>{});
        return result;
    }

    async deployLocalSecondary(org, bootstrap, component, env) {
        throw new Error('Raft3ComponentType secondary is not implemented yet')
    }

    async deployLocalJoined(org, bootstrap, component, env) {
        throw new Error('not implemented yet')
    }

    async deployLocalSecondaryJoined(org, bootstrap, component, env) {
        throw new Error('not implemented yet')
    }

    async deployRemote(org, bootstrap, component, env) {
        throw new Error('Remote deploymenet for FabricCA is not implemented yet')
    }

}


module.exports = FabricCAComponentType