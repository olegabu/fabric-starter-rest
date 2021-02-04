const _ = require('lodash');
const cfg = require('$/config.js');
const logger = cfg.log4js.getLogger('NodeManager');
const certsManager = require('$/certs-manager');
const fabricCLI = require('$/fabric-cli');


class NodeManager {

    startupNode(env){
        logger.debug("Start node with env:", env);
        let result = fabricCLI.execShellCommand("docker-compose -f docker-compose.yaml -f docker-compose-couchdb.yaml -f https/docker-compose-generate-tls-certs.yaml -f https/docker-compose-https-ports.yaml -f docker-compose-ldap.yaml up -d --force-recreate",
            cfg.YAMLS_DIR, _.assign({}, env, {ORG: cfg.org, DOMAIN: cfg.domain}));
        logger.debug(result);
        if (_.get(result, "code") === 0) {
            // await this.deployWebappIfPresent(extractPath, appName, app);
            return {resultCode: result.code, output: _.split(result.stdout, '\n')};
        }
        throw new Error(`Docker-compose up error. Result code: ${result.code}, Console output: ${result.stdout}`);
    }

}

module.exports = new NodeManager()