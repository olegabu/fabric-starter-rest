const _ = require('lodash');
const async = require("async");
const JSON5 = require('json5');
require('json5/lib/register');

const cfg = require('../config');
const logger = cfg.log4js.getLogger(__filename);

const TaskBroker = require('./notification-manager/TaskBroker');

class ScenarioExecutor {

    constructor(app, eventBus, socketServer) {
        this.eventBus = eventBus;
        this.socketServer = socketServer;
        this.taskBroker = new TaskBroker(app, eventBus, this);
    }

    async executeScenario(req, res, scenarioId) {
        let scenario = this.loadScenario(scenarioId);
        let executionId = `task-${Math.random()}`;
        try {
            await async.eachSeries(_.get(scenario, 'steps'), async step => {
                if (step.task) await this.executeTask(step.task, req.body, req.fabricStarterClient, executionId);
            });
            logger.debug('task completed', scenario);
        } catch (e) {
            logger.error(scenario, e);
            // res.status(500).json(e && e.message);
        }
    }

    async executeTask(taskId, config, fabricStarterClient, executionId) {
        logger.debug("Executing task:", taskId, " with config: ", config);
        const taskClass = require(`./tasks/${taskId}`);
        let task = new (taskClass)(fabricStarterClient, this.eventBus, this.socketServer, this);
        return await task.run(_.assign({}, config, {executionId}));
    }

    async passTaskToOtherParty(config) {
        this.taskBroker.scheduleTaskToOtherOrg(config);
    }

    otherPartyTaskCompleted(executionId) {
        this.eventBus.emit('TaskCompleted', {executionId});
    }

    loadScenario(scenarioId) {
        const scenarios = this.loadScenarios();
        return _.get(scenarios, scenarioId);
    }

    loadScenarios() {
        return require('./scenarios.json5');
    }

    loadTasks() {
        return require('./tasks.json5');
    }

}

module.exports = ScenarioExecutor;