const fs = require('fs'),
    _ = require('lodash'),
    envsub = require('envsub');

const shell = require('shelljs');


const certPaths = {
    'admincerts': 'Admin@',
    'cacerts': 'ca.',
    'tlscacerts': 'tlsca.'
};

const DOMAIN = process.env.DOMAIN || 'example.com';
const ORG = process.env.ORG || 'org1';
const ORDERER_MSP_DIR = `crypto-config/ordererOrganizations/${DOMAIN}/msp`;
const WGET_OPTS = process.env.WGET_OPTS || '';

class FabricCLI {

    downloadOrdererMSP() {
        _.forEach(_.keys(certPaths), key => {
            let certFileName = `${certPaths[key]}${DOMAIN}-cert.pem`;
            let directoryPrefix = `${ORDERER_MSP_DIR}/${key}`;
            shell.exec(`/usr/bin/wget ${WGET_OPTS} --directory-prefix ${directoryPrefix} http://www.${DOMAIN}/msp/${key}/${certFileName}`);
        });
    }

    envSubst(templateFile, outputFile) {
        return envsub({templateFile, outputFile, options: {diff: false}});
    }


    generateConfigTxForChannel(channelName, configDir, profile, outputTxFile) {
        shell.exec(`configtxgen -channelID ${channelName} -configPath ${configDir} -profile ${profile} -outputCreateChannelTx ${outputTxFile}`)
    }

    execPeerCommand(command, paramsStr) {
        shell.exec(`peer ${command} -o orderer.${DOMAIN}:7050 --tls --cafaile /etc/hyperledger/crypto/orderer/tls/ca.crt ${paramsStr}`)
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

