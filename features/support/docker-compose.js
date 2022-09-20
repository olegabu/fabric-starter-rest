const path = require("path");
const _ = require("lodash");
const compose = require("docker-compose");
const util = require("../../util");

module.exports = {
    upServicesInWorkDir: upServicesInWorkDir
}

async function startPeer (peerName, orgDomain, servicesList) {
    const fixtureDir = path.join(__dirname, `network/${orgDomain}/${peerName}`);
    await unzipRaftWALFiles(fixtureDir)
    const servicesToStart = _.split(process.env.PRIMARY_NODE_SERVICES || servicesList, ',');
    await upServicesInWorkDir(fixtureDir, servicesToStart, {commandOptions: ['--force-recreate']})
    await util.sleep(5000) //todo: use docker wait
}


async function upServicesInWorkDir(workDir, services, options) {

    const optionsWithWorkDir = _.assign({cwd: workDir, log: true, env: {...process.env, PWD: workDir}}, options);
    const nonEmptyServices = _.filter(services, s => !_.isEmpty(s))
    _.isEmpty(nonEmptyServices) ? await compose.upAll(optionsWithWorkDir) : await compose.upMany(services, optionsWithWorkDir)
}

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