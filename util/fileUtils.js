const fs = require('fs')
const path = require('path')
const _ = require('lodash')

function getFileBaseName(fileName) {
    const fileBaseName = path.basename(fileName, path.extname(fileName));
    return fileBaseName;
}

async function readDir(path, options) {
    return new Promise((resolve, reject) => {
        fs.readdir(path, options, (err, files) => {
            return err ? reject(err) : resolve(files)
        })
    })
}


module.exports = {
    getFileBaseName: getFileBaseName,
    readDir: readDir,
}