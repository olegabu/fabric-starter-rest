const _ = require('lodash');
const compose = require('docker-compose');

const Org = require('../../model/Org');
const cfg = require('../../config');
const logger = cfg.log4js.getLogger(__filename);

class PrepareRaft1Node {

    constructor(fabricStarterClient, eventBus) {
        this.fabricStarterClient = fabricStarterClient;
    }

    async run(config) {

        let commonEnv = this.prepareEnvFromConfig(config);
        let env = this.updateOrdererEnv(commonEnv, 'ORDERER_NAME', 'ORDERER_PORT', 'RaftOrdererGenesis');
        logger.debug('Executing docker-compose with env:', env);
        await this.dockerCompose(env, ['docker-compose-orderer.yaml', 'docker-compose-orderer-domain.yaml'], 'pre-install');
        await this.dockerCompose(env, ['docker-compose-orderer.yaml', 'docker-compose-orderer-domain.yaml'], 'www.orderer', ['--no-deps']);
        await this.fabricStarterClient.invoke(cfg.DNS_CHANNEL, 'dns', 'registerOrderer', [env.ORDERER_NAME, env.ORDERER_DOMAIN, env.ORDERER_PORT, cfg.MY_IP || ''], null, true);

    }

    async dockerCompose(env, yamlFiles, yamlService, upOptions) {
        logger.debug(`Executing: docker-compose up ${yamlFiles} ${yamlService}`);
        await compose.upOne(yamlService, {
            cwd: cfg.DOCKER_COMPOSE_DIR,
            config: yamlFiles,
            env: env,
            commandOptions: upOptions,
            log: true

        }).then(() => {
            logger.debug(`Completed: docker-compose up ${yamlFiles} ${yamlService}`);
        }).catch(err => {
            console.error('Error on docker-compose up', err);
        })
    }

    prepareEnvFromConfig(config) {
        const commonEnv = _.assign({}, process.env, {
            ORDERER_NAME: _.get(config, 'MY_ORDERER_NAME', cfg.HARDCODED_ORDERER_NAME),
            ORDERER_DOMAIN: _.get(config, 'MY_ORDERER_DOMAIN', cfg.domain),
            ORDERER_PORT: _.get(config, 'MY_ORDERER_PORT', '7050'),
            WWW_PORT: _.get(config, 'WWW_PORT') || "80",
            RAFT_NODES_COUNT: _.get(config, 'RAFT_NODES_COUNT', "3"),
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

module.exports = PrepareRaft1Node;