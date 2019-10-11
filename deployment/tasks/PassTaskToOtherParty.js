const _ = require('lodash');
const axios = require('axios');

const cfg = require('../../config');

class PassTaskToOtherParty {

    constructor(fabricStarterClient) {
        this.fabricStarterClient = fabricStarterClient;
    }

    async run(config) {
        let task = _.get(config, 'task');
        let otherPartyUrl = _.get(config, 'url');

        await axios.post(`http://${otherPartyUrl}/externaltask`, {
            task: task,
            params: config,
            executionId: `task-${Math.random()}`,
            callbackUrl: `${cfg.MY_IP}:4000`
        }).then(response => {
            console.log(response);
        }).catch(err => {
            console.log(err);
        });
    }
}

module.exports = PassTaskToOtherParty;