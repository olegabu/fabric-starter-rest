'use strict';

const assert = require('assert');
// const expect = require('chai').expect;

const FabricStarterClient = require('../../../fabric-starter-client');
const fabricStarterClient = new FabricStarterClient();


const ScenarioExecutor = require('../../../deployment/ScenarioExecutor');


describe('test join-to-raft scenario', function () {

    this.timeout(2000);
    before('initialize', async () => {
        await fabricStarterClient.init();
        await fabricStarterClient.loginOrRegister('testUser', 'testPass');
    });

    describe('Test Scenario execution', () => {

        describe('#joinRaftNode', () => {
            it('prepare new raft orderer', async () => {

                const scenarioExecutor= new ScenarioExecutor();
                const taskConfig = {ORDERER_NAME:'raft4', ORDERER_DOMAIN:'osn-org2.example.com', ORDERER_PORT:'7450', apiPort:'4000'};
                await scenarioExecutor.executeTask('StartRaft1Node', taskConfig, fabricStarterClient, 'test-execution');

            });
        });
    });
});