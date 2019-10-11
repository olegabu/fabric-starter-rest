const _ = require('lodash');
const Org = require('./model/Org');

class AddOrgToChannel {

    constructor(fabricStarterClient) {
        this.fabricStarterClient = fabricStarterClient;
    }

    async run(config) {
        let channel = _.get(config, 'channel');

        this.fabricStarterClient.addOrgToChannel(channel, Org.orgFromHttpBody(config));
    }
}

module.exports = AddOrgToChannel;