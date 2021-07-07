(function () {
    const fse = require('fs-extra');
    const path = require('path');
    const express = require('express');
    const _ = require('lodash');
    require('json5/lib/register');
    const cfg = require('./config.js');
    const logger = cfg.log4js.getLogger('AppManager');
    const archives = require('./service/archive-manager');
    const fabricCLI = require('./fabric-cli');
    const fileUtils = require('./util/fileUtils')

    class AppManager {

        async provisionWebApp(fileObj) {
            let baseFileName = fileUtils.getFileBaseName(fileObj.originalname);
            const appFolderPath = path.join(cfg.WEBAPPS_DIR, baseFileName);

            return archives.extract(fileObj.path, fileObj.originalname, cfg.WEBAPPS_DIR, true)
                .then(() => {
                    return {context: baseFileName, folder: appFolderPath};
                });
        }

        async getWebAppsList() {
            return new Promise((resolve, reject) => {
                fse.readdir(cfg.WEBAPPS_DIR, (err, fileList) => {
                    return err ? resolve([]) : resolve(fileList);
                })
            })
        }

        async provisionMiddleware(fileObj) {
            const extractPath = cfg.MIDDLWARE_DIR;
            if (!fse.existsSync(extractPath)) {
                fse.mkdir(extractPath);
            }

            return new Promise((resolve, reject) => {
                const destFile = path.resolve(extractPath, fileObj.originalname);
                fse.copyFile(fileObj.path, destFile, err => {
                    return err ? reject(err) : resolve(destFile);
                });
            });

        }

        async getMiddlewareList() {
            return new Promise((resolve, reject) => {
                fse.readdir(cfg.MIDDLWARE_DIR, (err, fileList) => {
                    return err ? resolve([]) : resolve(fileList);
                })
            })
        }

        redeployWebapp(expressApp, appContext, appFolder) {
            expressApp.use(`/${cfg.WEBAPPS_DIR}/${appContext}`, express.static(appFolder));
        }

        async redeployAllAppstoreApps(expressApp) {
            let appsCfgs = await this.loadAppStoreConfig();
            _.each(appsCfgs, cfg => {
                this.deployAppstoreApp(cfg.name, cfg.folder, cfg.port);
            })
        }


        async provisionAppstoreApp(expressApp, fileObj) {
            try {
                let baseFileName = fileUtils.getFileBaseName(fileObj);
                const appFolderPath = path.join(cfg.APPSTORE_DIR, baseFileName);
                logger.debug("Provisioning Appstore app", appFolderPath, fileObj);
                let extractPath = await archives.extract(fileObj.path, fileObj.originalname, appFolderPath, true);
                let port = await this.assignPortAndSave(baseFileName, extractPath);
                return await this.deployAppstoreApp(baseFileName, extractPath, port, expressApp);
            } catch (e) {
                console.error('Error deploying app:', e)
                throw e
            }
        }

        async deployAppstoreApp(appName, extractPath, port, app) {
            let result = fabricCLI.execShellCommand("docker-compose up -d --force-recreate", extractPath, {
                PORT: port
            });
            if (!result.isError()) {
                await this.deployWebappIfPresent(extractPath, appName, app);
                return result;
            }
            throw new Error(`Docker-compose up error. Return code: ${result.code}, Console output: ${result.output}`);
        }

        async assignPortAndSave(appName, extractPath) {
            let appsCfgs = await this.loadAppStoreConfig();
            let port = PortAssigner.assignAppOnPort(appsCfgs, appName);
            logger.debug("Port assigned:", port);
            await this.saveAppStoreConfig(_.assign(appsCfgs, {
                [appName]: {
                    name: appName,
                    folder: extractPath,
                    port: port
                }
            }));
            return port;
        }

        async deployWebappIfPresent(extractPath, baseFileName, app) {
            const webappDir = path.join(extractPath, "webapp");
            if (fse.existsSync(webappDir)) {
                const appFolder = path.join(cfg.WEBAPPS_DIR, baseFileName);
                await fse.copy(webappDir, appFolder);
                this.redeployWebapp(app, baseFileName, appFolder);
            }
        }

        async getAppstoreList() {
            return this.loadAppStoreConfig()
                .then(appsCfgs => _.map(appsCfgs, e => e));
        }

        async getAppStatus(appName) {
            let result = fabricCLI.execShellCommand(`docker logs --tail 1000 ${appName}.${cfg.org}.${cfg.domain}`);
            return {output: _.split(result.stdout, '\n')};
        }

        async loadAppStoreConfig() {
            const appCfgFile = this.getAppCfgFile();
            return fse.ensureFile(appCfgFile)
                .then(() => fse.readJson(appCfgFile))
                .catch(() => new Object({}));
        }

        async saveAppStoreConfig(appsCfg) {
            return fse.outputJson(this.getAppCfgFile(), appsCfg);
        }

        getAppCfgFile() {
            const appCfgFile = path.join(cfg.APPSTORE_DIR, "./deployed-apps.cfg");
            return appCfgFile;
        }

    }

    class PortAssigner {
        static assignAppOnPort(appsCfgs, appName) {

            let port = appsCfgs[appName]
                ? _.get(appsCfgs, `${appName}.port`)
                : this.assignFreePort(appsCfgs);
            return port;
        }

        static assignFreePort(appsCfgs) {
            const portRangesSequence = _.split(cfg.CUSTOM_APP_PORTS, ',');

            for (let i = 0; i < _.size(portRangesSequence); i++) {
                const portsRange = _.split(portRangesSequence[i], '-');
                let port = _.get(portsRange, "[0]");
                const rangeEnd = _.get(portsRange, "[1]") || port;

                while (port <= rangeEnd) {
                    if (!_.find(appsCfgs, item => item.port == port)) {
                        return port;
                    }
                    port++;
                }
            }
            throw new Error("No free ports in port range")
        }
    }

    module.exports = new AppManager();
})
();

