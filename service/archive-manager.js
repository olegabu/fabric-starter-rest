const fse = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const unzip = require('unzipper');
const tar = require('tar');
const tt = require("tar-transform");
const cfg = require('../config.js');
const {ReadEntry} = require("tar");
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

class MyEntry extends ReadEntry {
    constructor (header, ex, gex) {
        super(header, ex, gex)
    }

    write(source){
        console.log(this)
    }

    pipe(source) {
        console.log(this)
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
};


class ArchiveManager {

    async extractUploadedArchive(uploadedFile, extractPath, transform) {
        const extractTarStream = this.extractTarTransform(uploadedFile.path, transform );

        return await this.extractStream(extractTarStream, '.tgz', extractPath)
        // return await this.extract(uploadedFile.path, uploadedFile.originalname, extractPath)
    }

    extractTarTransform(sourcePath, transform=(name=>name)) {
        const readStream = fse.createReadStream(sourcePath);
        return readStream.pipe(tt.extract({gzip: true}))
            .pipe(tt.transform({
            onEntry(entry) {
                let headers = entry.headers
                const newName = transform(headers.name)
                headers  = {...headers, name: newName}
                this.push({...entry, headers});
            }
        })).pipe(tt.pack({ gzip: true }))
    }

    async extract(sourcePath, sourceFileName, extractPath) {
        let archiveType = path.extname(sourceFileName) || ".zip";
        logger.debug(`Extracting archive: ${sourceFileName}`, archiveType)
        const readStream = fse.createReadStream(sourcePath);

        const resultStream = await this.extractStream(readStream, archiveType, extractPath, sourcePath)
        resultStream.on('close', async function () { //TODO: this does not work
            logger.debug(`Extracting archive finished: ${sourceFileName}`)
            unlinkFile(sourcePath);
        })
        resultStream.on('error', async function (err) {
            logger.debug(`Extracting archive error: ${sourceFileName}`, err)
            unlinkFile(sourcePath);
            // reject();
        })
        return extractPath
    }

    extractStream(readStream, archiveType='.zip', extractPath, sourcePath) {//TODO: unlink source in a caller
        let extractor = ARCHIVES_EXTRACTOR[archiveType];
        return new Promise((resolve, reject) => {
            logger.debug(`Extracting stream: `, extractor)
            return fse.emptyDir(extractPath).then(() => {
                try {
                    let outStream = extractor.extractionOutStream(extractPath);
                    const pipe = readStream.pipe(outStream); //TODO: check if folder inside zip have different name
                    pipe.on('close', async function () {
                        logger.debug(`Extracting stream finished`)
                        sourcePath && unlinkFile(sourcePath);
                        resolve(outStream);
                    });
                    pipe.on('error', async function (err) {
                        logger.debug(`Extracting stream error:`, err)
                        sourcePath && unlinkFile(sourcePath);
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
        const tarOrig = tar.c(
            {
                [targetFileName ? 'file' : '']: targetFileName,
                gzip: true, // this will perform the compression too
                cwd: sourcePath,
                filter: (path, stat) => {
                    logger.debug('gzip add:', path);
                    if (new RegExp(filter).test(path)) {
                        logger.debug('gzip exclude:', path);
                        return false
                    }
                    return true
                }
            },
            ['./'],
        );
        // const converted = tarOrig.pipe(tar.t({
        //     onentry: e=>{if (_.includes(e.header.path, 'peer')) console.log('T'); e.header.path=_.replace(e.header.path, 'peer', 'neer')}
        // }));
        return tarOrig
    }
}


module.exports = new ArchiveManager();

