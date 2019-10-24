const _ = require('lodash');
const Docker = require('dockerode');

const cfg = require('../../config');
const logger = cfg.log4js.getLogger('startRaftCluster');

const compose = require('docker-compose');

const composeUtils =  require('./docker-compose/ComposeUtils');

class startRaftOrderingService3Nodes {

    constructor(fabricStarterClient) {
        this.fabricStarterClient = fabricStarterClient;
    }

    async run(config) {
        let commonEnv = composeUtils.prepareEnvFromConfig(config);
        let env = composeUtils.getCurrentOrdererEnv(commonEnv, 'ORDERER_NAME_0', 'RAFT0_PORT', 'Raft3OrdererGenesis');

        await composeUtils.composeUp(env, ['docker-compose-orderer.yaml', 'docker-compose-orderer-domain.yaml', 'docker-compose-orderer-ports.yaml'], 'cli.orderer');
        // await this.dockerCompose(env, ['docker-compose-orderer.yaml', 'docker-compose-orderer-domain.yaml', 'docker-compose-orderer-ports.yaml'], 'cli.orderer');
        await this.fabricStarterClient.invoke(cfg.DNS_CHANNEL, 'dns', 'registerOrderer', [env.ORDERER_NAME_0, env.ORDERER_DOMAIN, env.RAFT0_PORT, cfg.MY_IP || ''], null, true);

        env = composeUtils.getCurrentOrdererEnv(commonEnv, 'ORDERER_NAME_1', 'RAFT1_PORT', 'RaftOrdererGenesis');
        await composeUtils.composeUp(env, ['docker-compose-orderer.yaml', 'docker-compose-orderer-domain.yaml', 'docker-compose-orderer-ports.yaml'], 'cli.orderer');
        await this.fabricStarterClient.invoke(cfg.DNS_CHANNEL, 'dns', 'registerOrderer', [env.ORDERER_NAME_1, env.ORDERER_DOMAIN, env.RAFT1_PORT, cfg.MY_IP || ''], null, true);

        env = composeUtils.getCurrentOrdererEnv(commonEnv, 'ORDERER_NAME_2', 'RAFT2_PORT', 'RaftOrdererGenesis');
        await composeUtils.composeUp(env, ['docker-compose-orderer.yaml', 'docker-compose-orderer-domain.yaml', 'docker-compose-orderer-ports.yaml'], 'cli.orderer');

        await this.fabricStarterClient.invoke(cfg.DNS_CHANNEL, 'dns', 'registerOrderer', [env.ORDERER_NAME_2, env.ORDERER_DOMAIN, env.RAFT2_PORT, cfg.MY_IP || ''], null, true);
    }
}


module.exports = startRaftOrderingService3Nodes;