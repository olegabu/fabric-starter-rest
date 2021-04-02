const _ = require('lodash');
const fabricCLI = require('$/fabric-cli');
const ctUtils= require('../component-manager-utils')
const cfg = require('$/config.js');

class Raft3ComponentType {

    constructor(fabricStarterRuntime) {
        this.fabricStarterRuntime = fabricStarterRuntime
    }

    async deployLocalPrimary(org, bootstrap, component, env) {
        env = ctUtils.envWithDockerComposeProjectName(env, cfg.org)

        if (_.get(component, 'values.ORDERER_NAME')) cfg.setOrdererName(component.values.ORDERER_NAME)
        if (_.get(component, 'values.ORDERER_DOMAIN')) cfg.setOrdererDomain(component.values.ORDERER_DOMAIN)

        let resultOrderer = fabricCLI.execShellCommand("/bin/bash ./ordering-start.sh", cfg.YAMLS_DIR, env);
        return resultOrderer;
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
        throw new Error('Remote deploymenet for Raft3 is not implemented yet')
    }
}


module.exports = Raft3ComponentType