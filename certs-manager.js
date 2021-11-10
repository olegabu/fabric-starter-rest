'use strict';

const path = require('path');
const fs = require('fs');

const cfg = require('./config.js'),
    _ = require('lodash');

const CERT_PATHS_CONFIG = {
    'admincerts': {certFileNamePart: 'Admin@', envVar: 'ORG_ADMIN_CERT'},
    'cacerts': {certFileNamePart: 'ca.', envVar: 'ORG_ROOT_CERT'},
    'tlscacerts': {certFileNamePart: 'tlsca.', envVar: 'ORG_TLS_ROOT_CERT'}
};


class CertificateManager {

    get ordererMSPEnv() {
        return {
            CORE_PEER_LOCALMSPID: `${cfg.ordererName}.${cfg.ordererDomain}`,
            CORE_PEER_MSPCONFIGPATH: this.getMSPConfigDirectory(),
            CORE_PEER_TLS_ROOTCERT_FILE: this.getOrdererRootTLSFile()
        }
    }

    getOrdererMSPEnv() {
        return this.ordererMSPEnv;
    }

    getOrgBaseCertificationDirectory(orgId, domain, certsRootDir=cfg.CRYPTO_CONFIG_DIR) {
        return orgId ?
            `${certsRootDir}/peerOrganizations/${orgId}.${domain || cfg.domain}`
            : `${certsRootDir}/ordererOrganizations/${domain || cfg.ordererDomain}`;
    }

    getMSPConfigDirectory(orgId) {
        const certDomain = orgId ? `${orgId}.${cfg.domain}` : cfg.ordererDomain;
        return path.join(this.getOrgBaseCertificationDirectory(orgId), 'users', `Admin@${certDomain}`, 'msp');
    }

    forEachCertificate(orgId, domain, certsRootDir, /*function (certificateSubDir, fullCertificateDirectoryPath, certificateFileName, directoryPrefixConfig)*/ processorFunc) {
        _.forEach(_.keys(CERT_PATHS_CONFIG), certificateSubDir => {
            let fullCertificateDirectoryPath = this.getOrgBaseCertificationDirectory(orgId, domain, certsRootDir)+`/msp/${certificateSubDir}`;
            let certificateFilename = this.getCertFileName(certificateSubDir, orgId, domain);
            processorFunc(certificateSubDir, fullCertificateDirectoryPath, certificateFilename, CERT_PATHS_CONFIG[certificateSubDir]);
        });
    }

    getCertFileName(certificateSubDir, orgId, domain) {
        let certFileNamePart = _.get(CERT_PATHS_CONFIG, `[${certificateSubDir}].certFileNamePart`);
        let domainCertPath = this.getCertificationDomain(orgId, domain);
        let certFileName = `${certFileNamePart}${domainCertPath}-cert.pem`;
        return certFileName;
    }

    getOrdererRootTLSFile(ordererName = cfg.ordererName, ordererDomain = cfg.ordererDomain) {
        return `${this.getOrgBaseCertificationDirectory()}/msp/tlscacerts/tlsca.${ordererDomain}-cert.pem`
        // return `${this.getOrgBaseCertificationDirectory()}/orderers/${ordererName}.${ordererDomain}/tls/ca.crt`
    }

    getPrivateKeyFilePath(orgId) {
        const mspPath = this.getMSPConfigDirectory(orgId);
        const keystorePath = path.join(mspPath, 'keystore');
        const keystoreFiles = fs.readdirSync(keystorePath);
        const keyPath = path.join(keystorePath, keystoreFiles[0]);
        return keyPath;
    }

    getSignCertPath(orgId, domain) {
        const mspPath = this.getMSPConfigDirectory(orgId);
        const certificationDomain = this.getCertificationDomain(orgId, domain);
        const certPath = path.join(mspPath, 'signcerts', `Admin@${certificationDomain}-cert.pem`);
        return certPath;
    }

    getCertificationDomain(orgId, domain) {
        let domainCertPath = orgId ? `${orgId}.${domain || cfg.domain}` : domain || cfg.ordererDomain;
        return domainCertPath;
    }

}

module.exports = new CertificateManager();