const fs = require('fs-extra')
const path = require('path')
const _ = require('lodash')
const {Given, When, Then, } = require('cucumber');
const composeUtil = require('../../lib/docker-compose')
const archiverManager = require('../../../service/archive-manager')
const util = require('../../../util')


Given('peer0.org1.example.test and node is up, services {string}', {timeout: 50 * 1000}, async function (servicesList) {
    const fixtureDir = path.join(__dirname, 'first-org-primary-node');
    await unzipRaftWALFiles(fixtureDir)
    const servicesToStart = _.split(process.env.PRIMARY_NODE_SERVICES || servicesList, ',');
    await composeUtil.upServicesInWorkDir(fixtureDir, servicesToStart,{commandOptions: ['--force-recreate']})
    await util.sleep(5000) //todo: use docker wait
    return 'success';
})

async function unzipRaftWALFiles(fixtureDir) {
    const walName = '0000000000000000-0000000000000000'
    const walPath = path.join(fixtureDir, 'ledger/orderer/etcdraft/wal')
    await extractChannelWal(walPath, 'common', walName);
    await extractChannelWal(walPath, 'orderer-system-channel', walName);
}

async function extractChannelWal(walPath, channel, walName) {
    const channelWalPath = path.join(walPath, channel)
    const channelWalArchive = path.join(channelWalPath, `${walName}.zip`);
    const channelWalTargetName = path.join(channelWalPath, `${walName}.wal`);
    if (!await fs.exists(channelWalTargetName)) {
        await archiverManager.extract(channelWalArchive, `${walName}.zip`, channelWalPath)
    }
}