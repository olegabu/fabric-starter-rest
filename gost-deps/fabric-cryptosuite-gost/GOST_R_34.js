const crypto = require('crypto');
const gostDist = require('crypto-gost/dist/CryptoGost.js');
const gostCrypto = gostDist.CryptoGost;
const gostEngine = gostDist.GostEngine;


const GOST_R_34_10 = 'GOST R 34.10';
const GOST_R_34_10_94 = 'GOST R 34.10-94';

const GOST_R_34_11 = 'GOST R 34.11';
const GOST_R_34_11_94 = 'GOST R 34.11-94';

const GOST_R_34_10_WITH_11 = 'GOST R 34.10/GOST R 34.11';

const Hasher = gostEngine.getGostDigest({
    name: GOST_R_34_11,
    version: 1994,
    mode: 'HASH'
});

const Signer = gostEngine.getGostSign({
    name: GOST_R_34_10,
    version: 2001,
    mode: 'SIGN'
});

function loadKeyFromPEM(pem) {
    try {
        let key = gostCrypto.asn1.GostPrivateKeyInfo.decode(pem).object;
        key.buffer = Buffer.from(key.buffer).reverse();
        return key;
    } catch (e1) {
        try {
            let cert = gostCrypto.cert.X509.decode(pem);
            return gostCrypto.asn1.GostSubjectPublicKeyInfo.decode(cert.subjectPublicKeyInfo.encode()).object
        } catch (e2) {
            throw e1;
        }
    }
}

function digest(data) {
    return Hasher.digest(data);
}

function sign(key, content) {
    return Signer.sign(key, content);
}

function verify(key, signature, content) {
    return Signer.verify(key, signature, content);
}

module.exports = {
    loadKeyFromPEM: loadKeyFromPEM,
    digest: digest,
    sign: sign,
    verify: verify
};
