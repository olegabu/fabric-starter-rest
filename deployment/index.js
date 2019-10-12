const _ = require('lodash');
const axios = require('axios');
const JSON5 = require('json5');
require('json5/lib/register');

module.exports = function (app, fabricStarterClient, eventBus) {

    app.post('/deploy/scenario/:scenarioId', async (req, res) => {
        const scenarioId = _.get(req, 'params.scenarioId');
        await executeScenario(req, res, scenarioId);
    });

    app.post('/deploy/externaltask', async (req, res) => {
        let taskId = req.body.task;
        console.log("\n\nEXTERNALTASK\n\n");
        res.json(await executeTask(taskId, req.body, req.fabricStarterClient));
        axios.post(`${req.body.callbackUrl}//deploy/taskcompleted/${req.body.executionId}`);
    });

    app.post('/deploy/taskcompleted/:executionId', (req, res) => {
        console.log("\n\nTASKCOMPLETED\n\n");
        eventBus.emit('TaskCompleted', {executionId: _.get(req, 'params.executionId')});
    });

    app.get('/tasks', (req, res) => {
        res.json(require('./tasks.json5'));
    });

    app.get('/scenarios', (req, res) => {
        res.json({scenarios:loadScenarios(), tasks:require('./tasks.json5')});
    });

    async function executeScenario(req, res, scenarioId) {
        let scenario = loadScenario(scenarioId);
        _.forEach(_.get(scenario, 'steps'), async step => {
            if (step.task) await executeTask(step.task, req.body, req.fabricStarterClient, scenarioId);
        });
        res.json({message: 'task completed'});
    }

    async function executeTask(taskId, config, fabricStarterClient, executionId) {
        let task = new (require(`./tasks/${taskId}`))(fabricStarterClient);
        return await task.run(_.assign({}, config, {executionId}));
    }

    function loadScenarios() {
        return require('./scenarios.json5');
    }

    function loadScenario(scenarioId) {
        const scenarios = loadScenarios();
        return _.get(scenarios, scenarioId);
    }

};
