const glob = require('glob');
const path = require('path');
const cfg = require('../../config.js');
const logger = cfg.log4js.getLogger('event/handling');

module.exports=(eventBus, socketServer, osnManager)=>{

    glob.sync(path.join(__dirname, './handlers/**/*.js')).forEach(file => {
        require(path.resolve(file))(eventBus, socketServer, osnManager);
        logger.info('handler initialized:', file);
    });
};