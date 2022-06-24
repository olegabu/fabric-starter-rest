const _ = require('lodash');
// const Docker = require('dockerode');
const compose = require('docker-compose');

const cfg = require('config');
const logger = cfg.log4js.getLogger(__filename);

class ComposeUtils {

    prepareEnvFromConfig(config) {
        const ordererName = _.get(config, 'ORDERER_NAME', cfg.HARDCODED_ORDERER_NAME);
        const commonEnv = _.assign({}, process.env, {
            ORDERER_NAME: ordererName,
            ORDERER_DOMAIN: _.get(config, 'ordererDomain', cfg.domain),
            WWW_PORT: _.get(config, 'WWW_PORT', "80"),
            RAFT_NODES_COUNT: _.get(config, 'RAFT_NODES_COUNT', "3"),
            COMPOSE_PROJECT_NAME: `${ordererName}.${config.ordererDomain}`,
            ORDERER_GENERAL_LISTENPORT: _.get(config, 'ORDERER_PORT', '7050'),
        });

        const envWithMultiValueVars = this.parseMultiValueVarsToCommonEnv(config, commonEnv);
        return envWithMultiValueVars;

    }

    getCurrentOrdererEnv(commonEnv, ordererNameVar, ordererPortVar, genesisProfile) {
        const ordererName = _.get(commonEnv, ordererNameVar, cfg.HARDCODED_ORDERER_NAME);
        const ordererPort = _.get(commonEnv, ordererPortVar, _.get(cfg, ordererPortVar));
        return _.assign({}, commonEnv, {
            ORDERER_NAME: ordererName,
            ORDERER_GENERAL_LISTENPORT: ordererPort,
            COMPOSE_PROJECT_NAME: `${ordererName}.${commonEnv.ORDERER_DOMAIN}`,
            [genesisProfile ? 'ORDERER_GENESIS_PROFILE' : '']: genesisProfile,
        });
    }


    parseMultiValueVarsToCommonEnv(config, commonEnv){
        this.parseSequencedValues(config, commonEnv, 'ORDERER_NAMES', 'ORDERER_NAME_${i}', 'raft0,raft1,raft2');
        this.parseSequencedValues(config, commonEnv, 'ORDERER_PORTS', 'RAFT${i}_PORT', '7050,7150,7250');
        return commonEnv;
    }

    parseSequencedValues(config, commonEnv, sequencedVariable, singleVarsPattern, defaultValue) {
        const values = _.split(_.get(config, sequencedVariable, defaultValue), ',');
        for (let i = 0; i < _.size(values); i++) {
            commonEnv[eval('`' + singleVarsPattern + '`')] = values[i];
        }
    }

    async composeUp(env, yamlFiles, yamlService, commandOptions) {
        const options = this.createOptions(yamlFiles, env, commandOptions);
        return await this.runWithLog(`Docker-compose up ${yamlFiles} ${yamlService}`, compose.upOne(yamlService, options));
    }

    async composeExecCli(targetComponent, command, env, yamlFiles, yamlService, commandOptions) {
        const options = this.createOptions(yamlFiles, env, commandOptions);
        return await this.runWithLog(`Docker-compose exec to orderer ${targetComponent} ${yamlFiles} ${yamlService}`,
            compose.exec(`cli.${targetComponent}`, command , options));
    }


    createOptions(yamlFiles, env, commandOptions) {
        return {
            cwd: cfg.DOCKER_COMPOSE_DIR,
            config: yamlFiles,
            env: env,
            commandOptions: commandOptions,
            log: true
        };
    }

    async runWithLog(logMessage, dockerComposeResultPromise) {
        return dockerComposeResultPromise.then(() => {
            logger.debug(logMessage);
        }).catch(err => {
            console.error(`Error on ${logMessage}`, err);
        })
    }
}


module.exports = new ComposeUtils();