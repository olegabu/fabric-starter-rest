const _ = require('lodash');
const compose = require('docker-compose');


const cfg = require('../../config');
const logger = cfg.log4js.getLogger(__filename);

class AddOrdererToRaftOrderingService {

    constructor(fabricStarterClient, eventBus) {
        this.fabricStarterClient = fabricStarterClient;
    }

    async run(config) {
        let conf = _.get(config, 'params');
        let commonEnv = this.prepareEnvFromConfig(conf);
        let env = this.updateOrdererEnv(commonEnv, 'ORDERER_NAME', 'ORDERER_PORT', 'RaftOrdererGenesis');
        let targetOrderer=_.get(conf, 'TARGET_ORDERER');
        logger.debug('AddOrdererToRaftOrderingService by executing docker-compose with env:', {ORDERER_NAME: env.ORDERER_NAME, ORDERER_DOMAIN: env.ORDERER_DOMAIN, ORDERER_PORT: env.ORDERER_PORT, WWW_PORT: env.WWW_PORT});
        await compose.exec(`cli.${targetOrderer}`, `container-scripts/orderer/raft-full-add-new-orderer.sh ${env.ORDERER_NAME} ${env.ORDERER_DOMAIN} ${env.ORDERER_PORT} ${env.WWW_PORT}`, {log: true});
    }


    prepareEnvFromConfig(config) {
        const commonEnv = _.assign({}, process.env, {
            ORDERER_NAME: _.get(config, 'MY_ORDERER_NAME', cfg.HARDCODED_ORDERER_NAME),
            ORDERER_DOMAIN: _.get(config, 'MY_ORDERER_DOMAIN', cfg.domain),
            ORDERER_PORT: _.get(config, 'MY_ORDERER_PORT', '7050'),
            WWW_PORT: _.get(config, 'WWW_PORT') || "80",
        });

        return commonEnv;
    }

    updateOrdererEnv(commonEnv, ordererNameVar, ordererPortVar, genesisProfile) {
        const ordererName = _.get(commonEnv, ordererNameVar, cfg.HARDCODED_ORDERER_NAME);
        return _.assign({}, commonEnv, {
            ORDERER_NAME: ordererName,
            ORDERER_GENERAL_LISTENPORT: _.get(commonEnv, ordererPortVar, _.get(cfg, ordererPortVar)),
            [genesisProfile ? 'ORDERER_GENESIS_PROFILE' : '']: genesisProfile,
            COMPOSE_PROJECT_NAME: `${ordererName}.${commonEnv.ORDERER_DOMAIN}`
        });
    }
}

module.exports = AddOrdererToRaftOrderingService;