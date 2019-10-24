const _ = require('lodash');
const compose = require('docker-compose');

const Org = require('../../model/Org');
const cfg = require('../../config');
const logger = cfg.log4js.getLogger(__filename);

const composeUtils =  require('./docker-compose/ComposeUtils');

class PrepareRaft1Node {

    constructor(fabricStarterClient, eventBus) {
        this.fabricStarterClient = fabricStarterClient;
    }

    async run(config) {

        let commonEnv = composeUtils.prepareEnvFromConfig(config);
        const env = composeUtils.getCurrentOrdererEnv(commonEnv, 'ORDERER_NAME', 'ORDERER_GENERAL_LISTENPORT', 'RaftOrdererGenesis');
        await composeUtils.composeUp(env, ['docker-compose-orderer.yaml', 'docker-compose-orderer-domain.yaml', 'docker-compose-orderer-ports.yaml'], 'pre-install');
        await composeUtils.composeUp(env, ['docker-compose-orderer.yaml', 'docker-compose-orderer-domain.yaml'], 'www.orderer', ['--no-deps']);
        await this.fabricStarterClient.invoke(cfg.DNS_CHANNEL, 'dns', 'registerOrderer', [env.ORDERER_NAME, env.ORDERER_DOMAIN, env.ORDERER_GENERAL_LISTENPORT, cfg.MY_IP || ''], null, true);

    }

}

module.exports = PrepareRaft1Node;