const fabricCLI = require('./fabric-cli');
const cfg = require('./config');
const _ = require('lodash');
const util = require('./util');

const logger = cfg.log4js.getLogger('ChannelManager');


class ChannelManager {

    async joinChannel(channelId, fabricStarterClient, socketServer) {
        try {
            const ret = await fabricStarterClient.joinChannel(channelId);
            await util.retryOperation(cfg.LISTENER_RETRY_COUNT, async function () {
                await socketServer.registerChannelChainblockListener(channelId);
            });
            return ret;
        } catch(error) {
            logger.error(error.message);
            throw new Error(error.message);
        }
    }

    async applyConfigToChannel(channelId, currentChannelConfigFile, configUpdateRes, fabricClient, admin) {
        fabricCLI.downloadOrdererMSP();
        let channelGroupConfig = await fabricCLI.translateChannelConfig(currentChannelConfigFile);
        logger.debug(`Got channel config ${channelId}:`, channelGroupConfig);

        try {
            // let channelConfigEnvelope = JSON.parse(channelConfigBlock.toString());
            // let channelGroupConfig = _.get(channelConfigEnvelope, "data.data[0].payload.data.config");

            let updatedConfig = _.merge({}, channelGroupConfig);
            if (_.get(updatedConfig, "channel_group.groups")) {
                _.merge(updatedConfig.channel_group.groups, configUpdateRes.outputJson);
            }

            logger.debug(`Channel updated config ${channelId}:`, updatedConfig);
            let configUpdate = fabricCLI.computeChannelConfigUpdate(channelId, channelGroupConfig, updatedConfig);
            logger.debug(`Got updated envelope ${channelId}:`, _.toString(configUpdate));
            const txId = fabricClient.newTransactionID(admin);

            try {
                let signature = await fabricClient.signChannelConfig(configUpdate);
                let update = await fabricClient.updateChannel({
                    txId, name: channelId, config: configUpdate,
                    orderer: /*fabricClient.getOrderer(cfg.ORDERER_ADDR),*/ this.createOrderer(fabricClient),
                    signatures: [signature]
                });
                logger.info(`Update channel result ${channelId}:`, update);
            } catch (e) {
                logger.error(e);
            }
        } catch (e) {
            logger.error(`Couldn't fetch/translate config for channel ${channelId}`, e);
            throw  e;
        }
    }

    createOrderer(fabricClient, addr=cfg.ORDERER_ADDR, ordererRootTLSFile=cfg.ORDERER_TLS_CERT) {
        return fabricClient.newOrderer(`grpcs://${addr}`, {pem: util.loadPemFromFile(ordererRootTLSFile)});
    }
}

module.exports = new ChannelManager();
