const fs = require("fs");
const path = require('path');
const cfg = require('$/config.js');
const express = require("express");
const logger = cfg.log4js.getLogger('static-api');

module.exports = async function (app, server) {

    // serve admin and custom web apps as static

    const webappDir = process.env.WEBAPP_DIR || './webapp';
    app.use('/webapp', express.static(webappDir));
    logger.info(`serving webapp at /webapp from ${webappDir}`);
    app.use('/admin', express.static(cfg.WEBADMIN_DIR));
    app.use('/admin/*', express.static(cfg.WEBADMIN_DIR));
    logger.info(`serving admin at /admin from ${cfg.WEBADMIN_DIR}`);

// serve msp directory with certificates as static
    const mspDir = process.env.MSP_DIR || './msp';
    const serveIndex = require('serve-index');
//TODO serveIndex should show directory listing to find certs but not working
    app.use('/msp', express.static(mspDir), serveIndex('/msp', {'icons': true}));
    logger.info('serving certificates at /msp from ' + mspDir);

// serve favicon
    const favicon = require('serve-favicon');
    if(fs.existsSync(path.join(webappDir, 'favicon.ico'))) {
        app.use(favicon(path.join(webappDir, 'favicon.ico')));
    }

    app.get('/', (req, res) => {
        res.status(200).send('Welcome to fabric-starter REST server');
    });
}