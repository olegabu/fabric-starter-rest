const _ = require('lodash');
const axios = require('axios');

const cfg = require('../../config');
const logger = cfg.log4js.getLogger(__filename);
const naming = require('../../Naming');

class NotificationManager {

    constructor(app, fabricStarterClient, eventBus) {
        this.fabricStarterClient = fabricStarterClient;
        this.interactionHandler = new HttpInteractionHandler(app);
    }

    notifyOtherOrg(config) {
        return this.interactionHandler.notifyOrg(config)
    }

}


module.exports = NotificationManager;


class HttpInteractionHandler {

    constructor(app) {
        this.registerNotifyListener(app);
        this.registerCompletionListener(app);
    }

    async notifyOrg(config) {
        let task = _.get(config, 'task');
        let otherPartyIp = _.get(config, 'targetOrgMap.org.ip');
        let apiPort = _.get(config, 'apiPort');
        let orgDomain = _.get(config, 'targetOrgMap.orgDomain');
        let otherPartyDnsName = naming.getApiOrgAddress(orgDomain);

        let otherPartyUrl = (otherPartyIp || otherPartyDnsName) + `:${apiPort}`;

        let myUrl = cfg.MY_IP || `${naming.getApiOrgAddress(cfg.org, cfg.domain)}:${apiPort}`;

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
            logger.error("Error ", err, " for ", config);
        }
    }

    registerNotifyListener(app) {
        app.post('/deploy/externaltask', async (req, res) => {
            let taskId = req.body.task;
            console.log("\n\nEXTERNALTASK", req.body);
            let taskResult = await executeTask(taskId, _.get(req, 'body'), req.fabricStarterClient, req.body.executionId);
            try {
                let resp = await axios.post(`http://${req.body.callbackUrl}/settings/taskcompleted/${req.body.executionId}`);
                logger.debug("Response for EXTERNALTASK:", req.body, resp);
            } catch (e) {
                logger.error("Error for EXTERNALTASK:", req.body, e);
            }
            res.json(taskResult);
        });
    }

    registerCompletionListener(app) {
        app.post('/settings/taskcompleted/:executionId', (req, res) => {
            const executionId = _.get(req, 'params.executionId');
            console.log("\n\nTASKCOMPLETED, executionId:", executionId, "\n\n");
            eventBus.emit('TaskCompleted', {executionId: executionId});
            res.json({message: "completed"});
        });
    }
}