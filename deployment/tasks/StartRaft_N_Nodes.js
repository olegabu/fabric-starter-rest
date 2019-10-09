const _ = require('lodash');
const Docker = require('dockerode');
const compose = require('docker-compose');

const cfg = require('../../config');
const logger = cfg.log4js.getLogger('StartRaft_N_Nodes');

var docker = new Docker();

class StartRaft_N_Nodes {

    constructor(fabricStarterClient) {
        this.fabricStarterClient = fabricStarterClient;
    }

    async run(config) {
        let commonEnv = this.prepareEnvFromConfig(config);
        let env = this.updateOrdererEnv(commonEnv, 'ORDERER_NAME_1', 'RAFT0_PORT', 'Raft3OrdererGenesis');
        logger.debug('Executing docker-compose with env:', env);
        await this.dockerCompose(env, 'docker-compose-orderer.yaml', 'cli.orderer');

        env = this.updateOrdererEnv(commonEnv, 'ORDERER_NAME_2', 'RAFT1_PORT');
        await this.dockerCompose(env, 'docker-compose-orderer.yaml', 'cli.orderer');

        env = this.updateOrdererEnv(commonEnv, 'ORDERER_NAME_3', 'RAFT2_PORT');
        await this.dockerCompose(env, 'docker-compose-orderer.yaml', 'cli.orderer');

        await this.fabricStarterClient.invoke(cfg.DNS_CHANNEL, 'dns', 'registerOrderer', [cfg.MY_IP, env.ORDERER_NAME_1, env.ORDERER_DOMAIN, env.RAFT0_PORT], null, true);
        await this.fabricStarterClient.invoke(cfg.DNS_CHANNEL, 'dns', 'registerOrderer', [cfg.MY_IP, env.ORDERER_NAME_2, env.ORDERER_DOMAIN, env.RAFT1_PORT], null, true);
        await this.fabricStarterClient.invoke(cfg.DNS_CHANNEL, 'dns', 'registerOrderer', [cfg.MY_IP, env.ORDERER_NAME_3, env.ORDERER_DOMAIN, env.RAFT2_PORT], null, true);
    }

    async dockerCompose(env, yamlFiles, yamlService) {
        await compose.upOne(yamlService, {
            cwd: cfg.DOCKER_COMPOSE_DIR,
            config: yamlFiles,
            env: env,
            log: true
        }).then(() => {
            logger.debug(`Executed: docker-compose up ${yamlFiles} ${yamlService}`);
        }).catch(err => {
            console.error('Error on docker-compose up', err);
        })
    }

    prepareEnvFromConfig(config) {
        const commonEnv = _.assign({}, process.env, {
            ORDERER_DOMAIN: _.get(config, 'ORDERER_DOMAIN', cfg.domain),
            WWW_PORT: _.get(config, 'WWW_PORT') || "80",
            RAFT_NODES_COUNT: _.get(config, 'RAFT_NODES_COUNT', "3"),
        });

        this.parseSequencedValues(config, commonEnv, 'ORDERER_NAMES', 'ORDERER_NAME_${i + 1}', 'orderer,raft,raft2');
        this.parseSequencedValues(config, commonEnv, 'ORDERER_PORTS', 'RAFT${i}_PORT', '7050,7150,7250');

        return commonEnv;
    }

    parseSequencedValues(config, commonEnv, sequencedVariable, singleVarsPattern, defaultValue) {
        const values = _.get(config, sequencedVariable, defaultValue).split(",");
        for (let i = 0; i < _.size(values); i++) {
            commonEnv[eval('`'+singleVarsPattern+'`')] = values[i];
        }
    }

    updateOrdererEnv(commonEnv, ordererNameVar, ordererPortVar, genesisProfile) {
        const ordererName = _.get(commonEnv, ordererNameVar, cfg.HARDCODED_ORDERER_NAME);
        return _.assign({}, commonEnv, {
            ORDERER_NAME: ordererName,
            ORDERER_GENERAL_LISTENPORT: _.get(commonEnv, ordererPortVar, _.get(cfg, ordererPortVar)),
            ORDERER_GENESIS_PROFILE: genesisProfile,
            // DOMAIN: commonEnv.ORDERER_DOMAIN,
            COMPOSE_PROJECT_NAME: `${ordererName}.${commonEnv.ORDERER_DOMAIN}`
        });
    }
}


module.exports = StartRaft_N_Nodes;