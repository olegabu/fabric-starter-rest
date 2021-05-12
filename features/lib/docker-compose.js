const _ = require("lodash");
const compose = require("docker-compose");

async function upAllWithPWD(workDir, options) {

    const up = await compose.upAll(_.assign({
            cwd: workDir,
            log: true,
            env: {...process.env, PWD: workDir}
        }, options)
    )
}

module.exports = {
    upAllInWorkDir: upAllWithPWD
}