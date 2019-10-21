const _ = require('lodash');
const axios = require('axios');

const cfg = require('../../config');
const logger = cfg.log4js.getLogger(__filename);

class PassTaskToOtherParty {

    constructor(fabricStarterClient, eventBus, socketServer, notificationManager) {
        this.fabricStarterClient = fabricStarterClient;
        this.notificationManager = notificationManager;
    }

    async run(config) {

        const orgDomain =_.get(config, 'targetOrgMap.orgDomain');
        let task = _.get(config, 'task');

        return this.notificationManager.notifyOtherOrg(config);


        // let otherPartyUrl = _.get(config, 'url');
        let otherPartyDnsName = 'api.' + _.get(config, 'targetOrgMap.orgDomain');
        let otherPartyIp = _.get(config, 'targetOrgMap.org.ip');
        let apiPort=_.get(config, 'apiPort');
        let otherPartyUrl = (otherPartyIp || otherPartyDnsName)+`:${apiPort}`;

        let myUrl = cfg.MY_IP || `api.${cfg.org}.${cfg.domain}:${apiPort}`;
        let authHeader = 'Bearer ' + _.get(config, 'targetOrgMap.org.jwt');
        logger.debug("Passing task to other org:", otherPartyUrl, task, config);

        try {
            let resp = await axios.post(`http://${otherPartyUrl}/deploy/externaltask`, {
                    task: task,
                    params: config,
                    executionId: config.executionId,
                    callbackUrl: myUrl
                },
                {
                    headers: {Authorization: authHeader}
                });
            logger.debug("Response for ", config, resp);
        } catch (err) {
            logger.error("Error for ", config, err);
        }
    }
}

module.exports = PassTaskToOtherParty;