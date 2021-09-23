const fs = require('fs')
const path = require('path')
const _ = require('lodash')

function getFileBaseName(fileName) {
    let fileBaseName = path.basename(fileName, path.extname(fileName));
    fileBaseName = path.basename(fileBaseName, '.tar');
    fileBaseName = path.basename(fileBaseName, '.gz');
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