const fs = require('fs-extra')
const path = require('path')
const _ = require('lodash')
const {Given, When, Then, } = require('cucumber');
const composeUtil = require('../../lib/docker-compose')
const archiverManager = require('../../../service/archive-manager')


Given('first-org-primary-node org1.example.test is up', {timeout: 15 * 1000}, async function () {
    const fixtureDir = path.join(__dirname, 'first-org-primary-node');
    await unzipRaftWALFiles(fixtureDir)
    await composeUtil.upServicesInWorkDir(fixtureDir, _.split(process.env.PRIMARY_NODE_SERVICES, ','),{commandOptions: ['--force-recreate']})
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