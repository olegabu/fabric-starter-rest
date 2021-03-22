const _ = require('lodash');
const fabricCLI = require('$/fabric-cli');
const ctUtils= require('../component-manager-utils')
const cfg = require('$/config.js');

class Raft3ComponentType {

    async deploy(bootstrap, component, env) {
        env = ctUtils.envWithDockerComposeProjectName(env, cfg.org)

        if (_.get(component, 'ORDERER_NAME')) cfg.setOrdererName(component.ORDERER_NAME)
        if (_.get(component, 'ORDERER_DOMAIN')) cfg.setOrdererDomain(component.ORDERER_DOMAIN)

        let resultOrderer = fabricCLI.execShellCommand("/bin/bash ./ordering-start.sh", cfg.YAMLS_DIR, env);
        return resultOrderer;
    }
}


module.exports = new Raft3ComponentType()