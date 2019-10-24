const _ = require('lodash');

const cfg = require('../../config');
const logger = cfg.log4js.getLogger(__filename);

const composeUtils =  require('./docker-compose/ComposeUtils');

class AddOrdererToRaftOrderingService {

    constructor(fabricStarterClient, eventBus) {
        this.fabricStarterClient = fabricStarterClient;
    }

    async run(config) {
        let conf = _.get(config, 'params');
        let commonEnv = composeUtils.prepareEnvFromConfig(conf);
        let env = composeUtils.getCurrentOrdererEnv(commonEnv, 'ORDERER_NAME', 'ORDERER_GENERAL_LISTENPORT', 'RaftOrdererGenesis');
        let targetOrderer=_.get(conf, 'TARGET_ORDERER');
        logger.debug('AddOrdererToRaftOrderingService by executing docker-compose with env:', {ORDERER_NAME: env.ORDERER_NAME, ORDERER_DOMAIN: env.ORDERER_DOMAIN, ORDERER_PORT: env.ORDERER_GENERAL_LISTENPORT, WWW_PORT: env.WWW_PORT});
        // await compose.exec(`cli.${targetOrderer}`, `container-scripts/orderer/raft-full-add-new-orderer.sh ${env.ORDERER_NAME} ${env.ORDERER_DOMAIN} ${env.ORDERER_PORT} ${env.WWW_PORT}`, {log: true});
        await composeUtils.composeExecCli(targetOrderer, `container-scripts/orderer/raft-full-add-new-orderer.sh ${env.ORDERER_NAME} ${env.ORDERER_DOMAIN} ${env.ORDERER_GENERAL_LISTENPORT} ${env.WWW_PORT}`);
    }
}

module.exports = AddOrdererToRaftOrderingService;