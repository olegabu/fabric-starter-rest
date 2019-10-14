const _ = require('lodash');
const Org = require('../../model/Org');
const cfg = require('../../config');
const logger = cfg.log4js.getLogger(__filename);

class AddOrgToChannel {

    constructor(fabricStarterClient, eventBus) {
        this.fabricStarterClient = fabricStarterClient;
    }

    async run(config) {
        let channel = _.get(config, 'params.channel');
        const orgObj = Org.orgFromHttpBody(config.params);

        logger.info("Adding new org to channel ", channel, orgObj);
        try {
            await this.fabricStarterClient.addOrgToChannel(channel, orgObj);
        } catch (e) {
            console.log(e);
        }
        logger.info("Added new org:", orgObj);
    }
}

module.exports = AddOrgToChannel;