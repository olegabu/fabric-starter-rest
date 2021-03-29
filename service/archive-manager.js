const fse = require('fs-extra');
const path = require('path');
const unzip = require('unzipper');
const tar = require('tar');
const cfg = require('../config.js');
const logger = cfg.log4js.getLogger('ArchiveManager');

function unlinkFile(path) {
    try {
        fse.unlinkSync(path);
    } catch (e) {
        logger.warn(`Error deleting file ${path}`, e);
    }
}

class UnzipExtractor {
    extractionOutStream(extractPath) {
        logger.debug("Unzip to ", extractPath);
        return unzip.Extract({path: extractPath})
    }
}

class TarExtractor {
    extractionOutStream(extractPath) {
        logger.debug("Untar to ", extractPath);
        return tar.x({ // or tar.extract(
                // strip: 1,//nope
                cwd: extractPath
            }
        )
    }
}

class TarGzExtractor {
    extractionOutStream(extractPath) {
        logger.debug("Untargz to ", extractPath);
        return tar.x({ // or tar.extract(
                // strip: 1,//nope
                cwd: extractPath,
                gzip: true
            }
        )
    }
}


const ARCHIVES_EXTRACTOR = {
    '.zip': new UnzipExtractor(),
    '.tar': new TarExtractor(),
    '.tgz': new TarGzExtractor(),
};


class ArchiveManager {

    async extract(sourcePath, sourceFileName, extractPath) {
        let archiveType = path.extname(sourceFileName) || ".zip";
        let extractor = ARCHIVES_EXTRACTOR[archiveType];
        const fileBaseName = path.basename(sourceFileName, path.extname(sourceFileName));
        return new Promise((resolve, reject) => {
            return fse.emptyDir(path.join(extractPath, fileBaseName)).then(() => {
                try {
                    const readStream = fse.createReadStream(sourcePath);
                    let outStream = extractor.extractionOutStream(extractPath);

                    const pipe = readStream.pipe(outStream); //TODO: check if folder inside zip have different name
                    pipe.on('close', async function () {
                        unlinkFile(sourcePath);
                        resolve(extractPath);
                    });
                    pipe.on('error', async function () {
                        unlinkFile(sourcePath);
                        reject();
                    })
                } catch (e) {
                    reject(e);
                }
            })
        })
    }

    async gzip(sourcePath, filter, targetFileName) {
        logger.debug(`gzip path: ${sourcePath} to ${targetFileName}`, filter && ` with filter ${filter}`)
        return tar.c(
            {
                [targetFileName ? 'file' : '']: targetFileName,
                gzip: true, // this will perform the compression too
                cwd: sourcePath,
                filter: (path, stat) => {
                    logger.debug('include:', path);
                    if (new RegExp(filter).test(path)) {
                        logger.debug('gzip exclude:', path);
                        return false
                    }
                    return true
                }
            },
            ['./'],
        )
    }
}


module.exports = new ArchiveManager();

