const fse = require('fs-extra');
const path = require('path');
const unzip = require('unzipper');
const tar = require('tar');

function unlinkFile(path) {
    try {
        fse.unlinkSync(path);
    } catch (e) {
        logger.warn(`Error deleting file ${path}`, e);
    }
}

class UnzipExtractor {
    extractionOutStream(extractPath) {
        return unzip.Extract({path: extractPath})
    }
}

class TarExtractor {
    extractionOutStream(extractPath) {
        return tar.x({ // or tar.extract(
                strip: 1,
                cwd: extractPath
            }
        )
    }
}

class TarGzExtractor {
    extractionOutStream(extractPath) {
        return tar.x({ // or tar.extract(
                strip: 1,
                cwd: extractPath,
                gzip: true
            }
        )
    }
}


const ARCHIVES_EXTRACTOR = {
    '.zip': new UnzipExtractor(),
    '.tar': new TarExtractor(),
    '.gz': new TarGzExtractor(),
};


class ArchiveManager {

    async extract(sourcePath, sourceFileName, extractPath) {
        try {
            let archiveType = path.extname(sourceFileName) || ".zip";
            let extractor = ARCHIVES_EXTRACTOR[archiveType];

            return new Promise((resolve, reject) => {
                return fse.ensureDir(extractPath).then(()=> {
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
                })
            })
        } catch (e) {
            return Promise.reject(e);
        }
    }
}


module.exports=new ArchiveManager();

