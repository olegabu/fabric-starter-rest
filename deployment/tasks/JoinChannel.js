const _ = require('lodash');

class JoinChannel {

    constructor(fabricStarterClient) {
        this.fabricStarterClient = fabricStarterClient;
    }

    async run(config) {
        let channel = _.get(config, 'channel');

        this.fabricStarterClient.joinChannel(channel);
    }
}

module.exports = JoinChannel;