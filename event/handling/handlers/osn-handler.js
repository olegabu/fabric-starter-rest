const _ = require('lodash');
const cfg = require('../../../config.js');
const logger = cfg.log4js.getLogger(__filename);

let currOrderers = {};

module.exports = (eventBus, socketServer, osnManager) => {
    eventBus.on("osn-configuration-changed", async (osnConfig) => {
        const difference = _.difference(_.keys(osnConfig), _.keys(currOrderers));
        if (!_.isEmpty(difference)) {
            try {
                _.forEach(difference, newOrderer => {
                    let ordererConfig = _.get(osnConfig, `${newOrderer}`);
                    const osnName = _.get(ordererConfig, 'osnName', _.get(ordererConfig, 'ordererDomain'));
                    osnManager.registerOSN(osnName, osnConfig[newOrderer]);
                });

                await socketServer.sendRepeatingBlockNotification("common");
                currOrderers = osnConfig;

            } catch (e) {
                logger.error("Error at processing orderers info", e);
            }
        }
    });
};