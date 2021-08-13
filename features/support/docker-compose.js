const _ = require("lodash");
const compose = require("docker-compose");

async function upServicesWithPWD(workDir, services, options) {

    const optionsWithWorkDir = _.assign({cwd: workDir, log: true, env: {...process.env, PWD: workDir}}, options);
    const nonEmptyServices = _.filter(services, s => !_.isEmpty(s))
    _.isEmpty(nonEmptyServices) ? await compose.upAll(optionsWithWorkDir) : await compose.upMany(services, optionsWithWorkDir)
}

module.exports = {
    upServicesInWorkDir: upServicesWithPWD
}