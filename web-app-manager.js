const fs = require('fs');
const path = require('path');
const express = require('express');
const unzip = require('unzipper');
const _ = require('lodash');
const cfg = require('./config.js');
const logger = cfg.log4js.getLogger('FabricStarterClient');


function unlinkFile(path) {
    try {
        fs.unlinkSync(path);
    } catch (e) {
        logger.warn(`Error deleting file ${path}`, e);
    }
}

class WebAppManager {


    async provisionWebAppFromPackage(fileObj) {
        const readStream = fs.createReadStream(fileObj.path);
        const extractPath = cfg.WEBAPPS_DIR;
        if (!fs.existsSync(cfg.WEBAPPS_DIR)){
            fs.mkdirSync(cfg.WEBAPPS_DIR);
        }
        return new Promise((resolve, reject)=>{
            const pipe = readStream.pipe(unzip.Extract({path: extractPath})); //TODO: check if folder inside zip have different name
            pipe.on('close', async function () {
                unlinkFile(fileObj.path);
                resolve(extractPath);
            });
            pipe.on('error', async function () {
                unlinkFile(fileObj.path);
                reject();
            })
        })
    }

    async getWebAppsList() {
        return new Promise((resolve, reject) => {
            fs.readdir(cfg.WEBAPPS_DIR, (err, fileList) => {
                return err ? resolve([]) : resolve(fileList);
            })
        })
    }

    async provisionMiddleware(fileObj) {
        const readStream = fs.createReadStream(fileObj.path);
        const extractPath = cfg.MIDDLWARE_DIR;
        if (!fs.existsSync(cfg.MIDDLWARE_DIR)){
            fs.mkdir(cfg.MIDDLWARE_DIR);
        }

        return new Promise((resolve, reject)=> {
            const destFile = path.resolve(cfg.MIDDLWARE_DIR, fileObj.originalname);
            fs.copyFile(fileObj.path, destFile, err => {
                return err ? reject(err): resolve(destFile);
            });
        });

    }

    async getMiddlewareList() {
        return new Promise((resolve, reject) => {
            fs.readdir(cfg.MIDDLWARE_DIR, (err, fileList) => {
                return err ? resolve([]) : resolve(fileList);
            })
        })
    }

    redeployWebapp(app, appContext, appFolder) {
        app.use(`/${cfg.WEBAPPS_DIR}/${appContext}`, express.static(appFolder));
    }
}

module.exports = new WebAppManager();
