const fs = require('fs');
const urlParseLax = require('url-parse-lax');
const cfg = require('./config.js');

class Sdkhelper {

    loadPemFromFile(pemFilePath) {
        let certData = fs.readFileSync(pemFilePath);
        return Buffer.from(certData).toString()
    }

    // createOrderer() {
    //     let certData = fs.readFileSync(cfg.ORDERER_TLS_CERT);
    //     return this.client.newOrderer(`grpcs://${cfg.ORDERER_ADDR}`, {pem: Buffer.from(certData).toString()});
    // }

    createOrderer(fabricClient) {
        return fabricClient.newOrderer(`grpcs://${cfg.ORDERER_ADDR}`, {pem: this.loadPemFromFile(cfg.ORDERER_TLS_CERT)});
    }

    createPeer(fabricClient, i, org, domain, overridenPeerAddress) {
        const canonicalPeerAddress = `peer${i}.${org}.${domain}`;
        let url = `grpcs://${overridenPeerAddress || canonicalPeerAddress}`;
        let connectionOptions = this.defaultConnectionOptions(canonicalPeerAddress, i, org, domain);
        //
        // tlsCACerts: {
        //     path: `${cryptoConfigDir}/peerOrganizations/${org}.${domain}/peers/peer${i}.${org}.${domain}/msp/tlscacerts/tlsca.${org}.${domain}-cert.pem`
        // }
        return new fabricClient.newPeer(url, connectionOptions);
    }

    createPeerFromUrl(fabricClient, peerEndpoint) {
        let connectionOptions = this.defaultConnectionOptions(peerEndpoint);

        return fabricClient.newPeer(`grpcs://${peerEndpoint}`, connectionOptions);
    }


    defaultConnectionOptions(peerUrl, org, domain) {
        let parsedUrl = urlParseLax(peerUrl);
        let mspSubPath = parsedUrl.hostname;
        let connectionOptions = {
            'ssl-target-name-override': peerUrl,
            //'ssl-target-name-override': 'localhost',
            'grpc.keepalive_time_ms': 600000,
            pem: this.loadPemFromFile(`${cfg.PEER_CRYPTO_DIR}/peers/${mspSubPath}/msp/tlscacerts/tlsca.${org || cfg.org}.${domain || cfg.domain}-cert.pem`)
        };
        return connectionOptions;
    }
}

module.exports = new Sdkhelper();