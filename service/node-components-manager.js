const _ = require('lodash');
const cfg = require('$/config.js');
const logger = cfg.log4js.getLogger('NodeComponentsManager');
const util = require('$/util');
const fabricCLI = require('$/fabric-cli');
const Org = require("$/model/Org");


class NodeComponentsManager {

    constructor(fabricStarterRuntime) {
        this.fabricStarterRuntime = fabricStarterRuntime
    }

    async startupNode(env) {
        const resultOrderer = this.startOrderer(env);
        let peerResult='';
        if (!resultOrderer.isError()) {
            await util.sleep(4000)
            peerResult = this.startPeer(env);
            await util.sleep(4000)
            await this.fabricStarterRuntime.tryInitRuntime(Org.fromConfig(cfg))
        }
        return {StartOrderer: resultOrderer, StartPeer: peerResult}
    }

    startOrderer(env) {
        const fullEnv = envWithDockerComposeProjectName(env)
        let resultOrderer = fabricCLI.execShellCommand("/bin/bash ./ordering-start.sh", cfg.YAMLS_DIR, fullEnv);
        // if (resultOrderer.isError()) {
        //     throw new Error(`Docker-compose up error. Result code: ${resultOrderer.code}, Console output: \n${resultOrderer.output}`);
        // }
        return resultOrderer;
    }

    startPeer(env) {
        const fullEnv = envWithDockerComposeProjectName(env)
        let cmd = `docker-compose -f docker-compose.yaml -f docker-compose-couchdb.yaml -f docker-compose-ldap.yaml ${cfg.DOCKER_COMPOSE_EXTRA_ARGS} up `
            + ` -d --force-recreate --no-deps pre-install ca ldap-service ldapadmin couchdb.peer0 peer0 cli.peer post-install www.peer`;
        let result = fabricCLI.execShellCommand(cmd, cfg.YAMLS_DIR, fullEnv);
        return result;
    }
}

function envWithDockerComposeProjectName(env) {
    let fullEnv = _.assign({COMPOSE_PROJECT_NAME: cfg.org}, env)
    logger.debug("Full env:", fullEnv);
    return fullEnv;
}

module.exports = NodeComponentsManager