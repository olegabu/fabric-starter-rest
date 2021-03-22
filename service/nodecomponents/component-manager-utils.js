const _ = require('lodash')
const cfg = require('$/config.js');
const logger = cfg.log4js.getLogger('component-manager-utils');

module.exports = {

    envWithDockerComposeProjectName: (env, org) => {
        let fullEnv = _.assign({COMPOSE_PROJECT_NAME: org}, env)
        logger.debug("Full env:", fullEnv);
        return fullEnv;
    }

}