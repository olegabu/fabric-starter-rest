const fse = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const unzip = require('unzipper');
const tar = require('tar');
const tt = require("tar-transform");
const {ReadEntry} = require("tar");
const logger = require('../util/log/log4js-configured').getLogger('ArchiveManager');

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
                gzip: true,
                /* transform: (e)=>{
                     // if (_.includes(e.header.path, 'peer')) console.log(e.header.path); e.header.path=_.replace(e.header.path, 'peer', 'neer')
                     let h = e.header
                     h.set({path:_.replace(h.path, 'peer', 'neer')})
                     const myEntry = new ReadEntry(h, e.extended, e.globalExtended);
                     myEntry.on('data', e=>{
                         // console.log(e)
                     })
                     return myEntry
                 }*/

            }
        )
    }
}


const ARCHIVES_EXTRACTOR = {
    '.zip': new UnzipExtractor(),
    '.tar': new TarExtractor(),
    '.tgz': new TarGzExtractor(),
    '.gz': new TarGzExtractor(),
};


class ArchiveManager {

    async extractUploadedArchive(uploadedFile, extractPath, transform) {
        const extractTarStream = this.extractTarTransform(uploadedFile.path, transform);

        return await this.extractStream(extractTarStream, '.tgz', extractPath)

        //TODO: delete uploaded file ??

        // return await this.extract(uploadedFile.path, uploadedFile.originalname, extractPath)
    }

    extractTarTransform(sourcePath, transformFunc = (name => name)) {
        const readStream = fse.createReadStream(sourcePath);
        return readStream.pipe(tt.extract({gzip: true}))
            .pipe(tt.transform({
                onEntry(entry) {
                    let headers = entry.headers
                    const newName = transformFunc(headers.name)
                    headers = {...headers, name: newName}
                    this.push({...entry, headers});
                }
            })).pipe(tt.pack({gzip: true}))
    }

    async extract(sourceFile, sourceFileName, extractPath, deleteSourceFile) {
        let archiveType = path.extname(sourceFileName) || ".zip";
        logger.debug(`Extracting archive: ${sourceFileName}`, archiveType)
        const readStream = fse.createReadStream(sourceFile);

        const resultStream = await this.extractStream(readStream, archiveType, extractPath, sourceFile)
        resultStream.on('close', async function () { //TODO: this does not work
            logger.debug(`Extracting archive finished: ${sourceFileName}, Deleting source file: ${!!deleteSourceFile}`)
            if (deleteSourceFile) {
                unlinkFile(sourceFile);
            }
        })
        resultStream.on('error', async function (err) {
            logger.debug(`Extracting archive error: ${sourceFileName}, Deleting source file: ${!!deleteSourceFile}`, err)
            if (deleteSourceFile) {
                unlinkFile(sourceFile);
            }
            // reject();
        })
        return extractPath
    }

    async extractStream(readStream, archiveType = '.zip', extractPath, sourceFile) {//TODO: unlink source in a caller
        let extractor = ARCHIVES_EXTRACTOR[archiveType];
        return new Promise(async (resolve, reject) => {
            logger.debug(`Extracting stream: `, extractor)
            if (!sourceFile || path.normalize(path.dirname(sourceFile)) !== path.normalize(extractPath)) {
                await fse.emptyDir(extractPath)
            }
            try {
                let outStream = extractor.extractionOutStream(extractPath);
                const pipe = readStream.pipe(outStream); //TODO: check if folder inside zip have different name
                pipe.on('close', async function () {
                    logger.debug(`Extracting stream finished`)
                    // sourceFile && unlinkFile(sourceFile); //TODO: is deleted in extract(); check
                    resolve(outStream);
                });
                pipe.on('error', async function (err) {
                    logger.debug(`Extracting stream error:`, err)
                    // sourceFile && unlinkFile(sourceFile);
                    reject();
                })
            } catch (e) {
                reject(e);
            }
        })
    }

    async gzip(sourceDir, excludeRegexp = null, includeFiles = ['./']) {
        logger.debug(`gzip path: ${sourceDir} to stream`, excludeRegexp && ` excluding ${excludeRegexp}`)
        sourceDir = path.resolve(sourceDir)
        if (!fse.exists(sourceDir)) {
            throw new Error("Directory does not exist " + sourceDir)
        }

        const excludeFileFilterRegExp = new RegExp(excludeRegexp);
        const tarOrig = await tar.c(
            {
//                [targetFileName ? 'file' : '']: targetFileName,
                gzip: true, // this will perform the compression too
                cwd: sourceDir,
                filter: (path, stat) => {
                    logger.debug('gzip add:', path);
                    if (excludeFileFilterRegExp.test(path)) {
                        logger.debug('gzip exclude:', path);
                        return false
                    }
                    return true
                }
            },
            includeFiles
        );
        // const converted = tarOrig.pipe(tar.t({
        //     onentry: e=>{if (_.includes(e.header.path, 'peer')) console.log('T'); e.header.path=_.replace(e.header.path, 'peer', 'neer')}
        // }));
        return tarOrig
    }
}


module.exports = new ArchiveManager();

