'use strict';

const path = require('path');
const fs = require('fs');

const cfg = require('./config.js'),
    _ = require('lodash');

const CERT_FOLDERS_PREFIXES = {
    'admincerts': {certFileNamePart: 'Admin@', envVar: 'ORG_ADMIN_CERT'},
    'cacerts': {certFileNamePart: 'ca.', envVar: 'ORG_ROOT_CERT'},
    'tlscacerts': {certFileNamePart: 'tlsca.', envVar: 'ORG_TLS_ROOT_CERT'}
};


const ORDERER_BASE_CRYPTO_DIR = `${cfg.CRYPTO_CONFIG_DIR}/ordererOrganizations/${cfg.ORDERER_DOMAIN}`;
const PEER_BASE_CRYPTO_DIR = `${cfg.CRYPTO_CONFIG_DIR}/peerOrganizations/${cfg.org}.${cfg.domain}`;



class CertificateManager {

    constructor() {
        this.ordererMSPEnv = {
            CORE_PEER_LOCALMSPID: `${cfg.ordererName}.${cfg.ORDERER_DOMAIN}`,
            CORE_PEER_MSPCONFIGPATH: this.getMSPConfigDirectory(),
            CORE_PEER_TLS_ROOTCERT_FILE: this.getOrdererRootTLSFile()
        };
    }

    getOrdererMSPEnv() {
        return this.ordererMSPEnv;
    }

    getMyBaseCertificatesDirectory() {
        return cfg.isOrderer ? ORDERER_BASE_CRYPTO_DIR : PEER_BASE_CRYPTO_DIR;
    }

    getOrgBaseCertificationDirectory(orgId, domain) {
        return orgId ?
            `${cfg.CRYPTO_CONFIG_DIR}/peerOrganizations/${orgId}.${domain || cfg.domain}`
            : ORDERER_BASE_CRYPTO_DIR;
    }

    getMSPConfigDirectory(orgId) {
        const certDomain = orgId ? `${orgId}.${cfg.domain}` : cfg.ORDERER_DOMAIN;
        return path.join(this.getOrgBaseCertificationDirectory(orgId), 'users', `Admin@${certDomain}`, 'msp');
    }

    forEachCertificate(orgObj, domain, /*function (certificateSubDir, fullCertificateDirectoryPath, certificateFileName, directoryPrefixConfig)*/ processorFunc) {
        _.forEach(_.keys(CERT_FOLDERS_PREFIXES), certificateSubDir => {
            let fullCertificateDirectoryPath = `${this.getOrgBaseCertificationDirectory(_.get(orgObj, "orgId"), domain)}/msp/${certificateSubDir}`;
            let certificateFilename = this.getCertFileName(certificateSubDir, orgObj, domain);
            processorFunc(certificateSubDir, fullCertificateDirectoryPath, certificateFilename, CERT_FOLDERS_PREFIXES[certificateSubDir]);
        });
    }

    getCertFileName(certificateSubDir, orgObj, domain) {
        let certFileNamePart = _.get(CERT_FOLDERS_PREFIXES, `[${certificateSubDir}].certFileNamePart`);
        let domainCertPath = this.getCertificationDomain(_.get(orgObj, "orgId"), domain);
        let certFileName = `${certFileNamePart}${domainCertPath}-cert.pem`;
        return certFileName;
    }

    getOrdererRootTLSFile(ordererName = cfg.ordererName, ordererDomain = cfg.ORDERER_DOMAIN) {
        return `${this.getOrgBaseCertificationDirectory()}/msp/tlscacerts/tlsca.${cfg.ORDERER_DOMAIN}-cert.pem`
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
        let domainCertPath = orgId ? `${orgId}.${domain || cfg.domain}` : domain || cfg.ORDERER_DOMAIN;
        return domainCertPath;
    }

}

module.exports = new CertificateManager();