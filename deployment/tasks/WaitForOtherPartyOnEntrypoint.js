const _ = require('lodash');
const util = require('../../util');

class WaitForOtherPartyOnEntrypoint {

    constructor(fabricStarterClient, eventBus) {
        this.eventBus = eventBus;
    }

    async run(config) {
        return;
        /*
        let waiting = true;
        this.eventBus.on("TaskCompleted", event => {
            if (event.executionId === config.executionId) {
                waiting = false;
            }
        });
        while (waiting) {
            await util.sleep(1000);
        }*/
    }
}


module.exports = WaitForOtherPartyOnEntrypoint;