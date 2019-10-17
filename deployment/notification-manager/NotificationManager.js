const _ = require('lodash');
const axios = require('axios');

const cfg = require('../../config');
const logger = cfg.log4js.getLogger(__filename);

class NotificationManager {

    constructor(app, fabricStarterClient, eventBus) {
        this.fabricStarterClient = fabricStarterClient;
        this.eventsHandler= new HttpEventHandler(app);
    }

    notifyOtherOrg() {
        // this.eventsHandler.
    }

    eventReceived() {

    }
}


module.exports = NotificationManager;


class HttpEventHandler {

    constructor(app) {
        this.registerNotifier(app);
        this.registerListener(app);
    }

    notifyOtherOrg() {

    }

    registerNotifier(app) {
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

    registerListener(app) {
        app.post('/settings/taskcompleted/:executionId', (req, res) => {
            const executionId = _.get(req, 'params.executionId');
            console.log("\n\nTASKCOMPLETED, executionId:", executionId, "\n\n");
            eventBus.emit('TaskCompleted', {executionId: executionId});
            res.json({message: "completed"});
        });
    }
}