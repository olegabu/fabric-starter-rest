const fs = require('fs'),
    _ = require('lodash'),
    envsub = require('envsub'),
    shell = require('shelljs');

const cfg = require('./config.js');

const certPaths = {
    'admincerts': 'Admin@',
    'cacerts': 'ca.',
    'tlscacerts': 'tlsca.'
};

const WGET_OPTS = process.env.WGET_OPTS || '';

class FabricCLI {

    downloadOrdererMSP() {
        _.forEach(_.keys(certPaths), key => {
            let certFileName = `${certPaths[key]}${cfg.domain}-cert.pem`;
            let directoryPrefix = `${cfg.ORDERER_CRYPTO_DIR}/msp/${key}`;
            shell.exec(`/usr/bin/wget ${WGET_OPTS} --directory-prefix ${directoryPrefix} http://www.${cfg.domain}/msp/${key}/${certFileName}`);
        });
    }

    envSubst(templateFile, outputFile) {
        return envsub({templateFile, outputFile, options: {diff: false}});
    }


    generateConfigTxForChannel(channelName, configDir, profile, outputTxFile) {
        shell.exec(`configtxgen -channelID ${channelName} -configPath ${configDir} -profile ${profile} -outputCreateChannelTx ${outputTxFile}`)
    }

    execPeerCommand(command, paramsStr) {
        shell.exec(`peer ${command} -o ${cfg.ORDERER_ADDR} --tls --cafaile /etc/hyperledger/crypto/orderer/tls/ca.crt ${paramsStr}`)
    }

    generateChannelConfigTx(channelName) {
        return this.envSubst("templates/configtx-template.yaml", "crypto-config/configtx.yaml")
            .then(envObj => {
                let outputTxFile = `crypto-config/configtx/channel_${channelName}.tx`;
                this.generateConfigTxForChannel(channelName, "crypto-config", "CHANNEL", outputTxFile);
                return outputTxFile;
            });
    }

    async generateChannelConfigTxContent(channelName) {
        let channelTxFile = await this.generateChannelConfigTx(channelName);
        return new Promise((resolve, reject) => {
            fs.readFile(channelTxFile, (err, data) => {
                !err ? resolve(data) : reject(err);
            })
        }).catch(console.log)
    }
}


module.exports = new FabricCLI();

