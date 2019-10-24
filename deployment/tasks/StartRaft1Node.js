const _ = require('lodash');
const compose = require('docker-compose');

const Org = require('../../model/Org');
const cfg = require('../../config');
const logger = cfg.log4js.getLogger(__filename);

const composeUtils =  require('./docker-compose/ComposeUtils');

class StartRaft1Node {

    constructor(fabricStarterClient, eventBus) {
        this.fabricStarterClient = fabricStarterClient;
    }

    async run(config) {
        let commonEnv = composeUtils.prepareEnvFromConfig(config);
        logger.debug('Executing docker-compose with env:', commonEnv);
        await composeUtils.composeUp(commonEnv, ['docker-compose-orderer.yaml', 'docker-compose-orderer-domain.yaml', 'docker-compose-orderer-ports.yaml'], 'orderer');
        await this.fabricStarterClient.invoke(cfg.DNS_CHANNEL, 'dns', 'registerOrderer', [env.ORDERER_NAME, env.ORDERER_DOMAIN, env.ORDERER_PORT, cfg.MY_IP || ''], null, true);
    }
}

module.exports = StartRaft1Node;