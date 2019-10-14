const _ = require('lodash');
const util = require('../../util');
const cfg = require('../../config');
const logger = cfg.log4js.getLogger(__filename);

class WaitForOtherPartyOnEntrypoint {

    constructor(fabricStarterClient, eventBus) {
        this.eventBus = eventBus;
    }

    async run(config) {
        let waiting = true;
        logger.debug("Start wait for other party for ", config);

        this.eventBus.on("TaskCompleted", event => {
            logger.debug("task completed event ", event, "for: ", config);

            if (event.executionId === config.executionId) {
                waiting = false;
                logger.debug("Complete TaskCompleted: ", config);
            }
        });
        while (waiting) {
            await util.sleep(1000);
        }
    }
}


module.exports = WaitForOtherPartyOnEntrypoint;