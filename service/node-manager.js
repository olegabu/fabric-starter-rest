const _ = require('lodash');
const cfg = require('$/config.js');
const logger = cfg.log4js.getLogger('NodeManager');
const util = require('$/util');
const fabricCLI = require('$/fabric-cli');


class NodeManager {

    async startupNode(env) {
        let fullEnv = _.assign({COMPOSE_PROJECT_NAME: env.ORG}, env)
        logger.debug("Start node with env:", fullEnv);
        // let resultOrderer = fabricCLI.execShellCommand("docker-compose -f docker-compose-orderer.yaml -f docker-compose-orderer-ports.yaml up -d --force-recreate",
        //     cfg.YAMLS_DIR, fullEnv);

        let resultOrderer = fabricCLI.execShellCommand("/bin/bash ./ordering-start.sh", cfg.YAMLS_DIR, fullEnv);
        logger.debug('./ordering-start.sh:', _.split(resultOrderer, '\n'));
        if (_.get(resultOrderer, "code") !== 0) {
            throw new Error(`Docker-compose up error. Result code: ${resultOrderer.code}, Console output: \n${resultOrderer.stdout}`);
        }

        await util.sleep(4000)

        let cmd = `docker-compose -f docker-compose.yaml -f docker-compose-couchdb.yaml ${cfg.DOCKER_COMPOSE_EXTRA_ARGS} up -d --force-recreate --no-deps couchdb.peer0 peer0 cli.peer post-install www.peer`;
        let result = fabricCLI.execShellCommand(cmd, cfg.YAMLS_DIR, fullEnv);
        logger.debug('docker-compose -f docker-compose.yaml', result);
        if (_.get(result, 'code') === 0) {
            return {
                resultCode: result.code,
                output: _.split(resultOrderer.stdout, '\n') + "\n" + _.split(result.stdout, '\n')
            };
        }
        throw new Error(`Docker-compose up error. Result code: ${result.code}, Console output: \n${result.stdout}`);
    }

}

module.exports = new NodeManager()