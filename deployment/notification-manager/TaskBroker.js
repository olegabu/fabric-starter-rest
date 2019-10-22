const _ = require('lodash');
const axios = require('axios');

const cfg = require('../../config');
const logger = cfg.log4js.getLogger(__filename);
const naming = require('../../Naming');

class TaskBroker {

    constructor(app, eventBus, scenarioExecutor) {
        this.scenarioExecutor = scenarioExecutor;
        this.interactionHandler = new HttpInteractionHandler(app, this);
    }

    scheduleTaskToOtherOrg(config) {
        return this.interactionHandler.scheduleToOtherOrg(config)
    }

    async receiveTaskFromOtherOrg(taskId, config, fabricStarterClient, executionId) {
        return this.scenarioExecutor.executeTask(taskId, config, fabricStarterClient, executionId);
    }

    otherPartyTaskCompleted(executionId) {
        return this.scenarioExecutor.otherPartyTaskCompleted(executionId);
    }
}


module.exports = TaskBroker;


class HttpInteractionHandler {

    constructor(app, taskBroker) {
        this.taskBroker = taskBroker;
        this.registerReceiveExternalTaskListener(app);
        this.registerTaskCompletedListener(app);
    }

    async scheduleToOtherOrg(config) {
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

    registerReceiveExternalTaskListener(app) {
        app.post('/deploy/externaltask', async (req, res) => {
            let taskId = req.body.task;
            logger.debug("\n\nEXTERNALTASK", req.body);
            let taskResult = await this.taskBroker.receiveTaskFromOtherOrg(taskId, _.get(req, 'body'), req.fabricStarterClient, req.body.executionId);
            try {
                let resp = await axios.post(`http://${req.body.callbackUrl}/settings/taskcompleted/${req.body.executionId}`);
                logger.debug("Response for EXTERNALTASK:", req.body, _.get(resp, 'body'));
            } catch (e) {
                logger.error("Error for EXTERNALTASK:", req.body, e);
            }
            res.json(taskResult);
        });
    }

    registerTaskCompletedListener(app) {
        app.post('/settings/taskcompleted/:executionId', (req, res) => {
            const executionId = _.get(req, 'params.executionId');
            console.log("\n\nReceived TASKCOMPLETED, executionId:", executionId, "\n\n");
            this.taskBroker.otherPartyTaskCompleted(executionId);
            res.json({message: "completed"});
        });
    }
}