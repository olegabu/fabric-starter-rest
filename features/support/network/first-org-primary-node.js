const path = require('path')
const {Given, When, Then, } = require('cucumber');
const composeUtil = require('../../lib/docker-compose')
const archiverManager = require('../../../service/archive-manager')



Given('first-org-primary-node org1.example.test is up', {timeout: 10 * 1000}, async function () {
    const fixtureDir = path.join(__dirname, 'first-org-primary-node');
    await unzipRaftWALFiles(fixtureDir)
    await composeUtil.upAllInWorkDir(fixtureDir, {commandOptions: ['--force-recreate']})

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
    const channelWarArchive = path.join(channelWalPath, `${walName}.zip`);
    await archiverManager.extract(channelWarArchive, `${walName}.zip`, channelWalPath)
}