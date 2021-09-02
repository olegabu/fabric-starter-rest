const api = require('fabric-client/lib/api.js');
const Hash = require('fabric-client/lib/hash.js');
const GostDist = require('crypto-gost/dist/CryptoGost.js');
const gostCrypto = GostDist.CryptoGost;
const GostEngine = GostDist.GostEngine;
const libGost = require('./lib-fabric-gost.js');
/**
 * Implementation of {@link module:api.Key} interface
 * @class
 * @extends module:api.Key
 */
class GOSTKey extends api.Key {

    constructor(buffer, type) {
        super();
        this.buffer = buffer;
        this.type = type;
    }

    /**
     * Returns true if this key is a symmetric key, false is this key is asymmetric
     *
     * @returns {boolean} if this key is a symmetric key
     */
    isSymmetric() {
        return false;
    }

    /**
     * Returns true if this key is an asymmetric private key, false otherwise.
     *
     * @returns {boolean} if this key is an asymmetric private key
     */
    isPrivate() {
        return this.type === 'private';
    }

    /**
     * Returns the corresponding public key if this key is an asymmetric private key.
     * If this key is already public, returns this key itself.
     *
     * @returns {module:api.Key} the corresponding public key if this key is an asymmetric private key.
     * If this key is already public, returns this key itself.
     */
    getPublicKey() {
        if (this.isSymmetric())
            throw new Error("Invalid key type");

        if (!this.isPrivate()) {
            return this;
        }

        // Generate public key from private key
        let algorithm = {
            id: "id-GostR3410-2001",
            name: "GOST R 34.10-2001",
            namedCurve: "S-256-A",
            ukm: this.buffer
        };
        // let algorithm = {
        //     name: a.name,
        //     version: a.version,
        //     length: a.length,
        //     usages: ['sign', 'verify'],
        //     namedCurve: a.namedCurve,
        //     ukm: this.pem
        // };
        //var algorithm = {
        //    name: 'GOST R 34.10',
        //    namedCurve: (this.theKey.algorithm || {}).namedCurve || "",
        //    ukm: this.theKey.buffer
        //};
        //if (algorithm.namedCurve.value.indexOf('512') >= 0)
        //    algorithm.algorithm.name += '-512';
        //GostCrypto.subtle.generateKey(algorithm, true, ['sign', 'verify']).then(function(keyPair) {
        //    return keyPair.publicKey;
        //});

        let gostsign = GostEngine.getGostSign(algorithm);
        const keypair = gostsign.generateKey();

        /*return new GOSTKey({
            type: 'public',
            extractable: 'true',
            algorithm: algorithm,
            usages: 'VERIFY',
            buffer: Buffer.from(keypair.publicKey)
        });*/
        return new GOSTKey(Buffer.from(keypair.publicKey), "public");
    }

    /**
     * Returns the subject key identifier of this key
     *
     * @returns {string} The subject key identifier of this key as a hexidecial encoded string
     */
    getSKI() {
        //let hash = libGost.digest(this.pem);
        //return gostCrypto.coding.Hex.encode(hash);
        let pubKey = this.getPublicKey();
        if (!pubKey || !pubKey.buffer)
            throw new Error('getSKI Error: key data is missing');

        return Hash.SHA2_256(pubKey.buffer);
    }

    /**
     * Converts this key to its PEM representation, if this operation is allowed.
     *
     * @returns {string} the PEM string representation of the key
     */
    toBytes() {
        if (this.isPrivate()) {
            var algorithm = {
                id: "id-GostR3410-2001",
                name: "GOST R 34.10-2001",
                namedCurve: "S-256-A",
                ukm: this.buffer
            };
            var pkasn1 = gostCrypto.asn1.GostPrivateKeyInfo.encode({
                algorithm: algorithm,
                buffer: this.buffer
            });
            return "-----BEGIN PRIVATE KEY-----\n" +
                Buffer.from(pkasn1).toString('base64').match(/.{0,92}/g).join('\n') +
                "-----END PRIVATE KEY-----";
        }
        //return gostCrypto.asn1.GostPrivateKeyInfo.encode(this.pem);

        return gostCrypto.asn1.GostSubjectPublicKeyInfo.encode(this.buffer);
    }


    /**
     * Generates a CSR/PKCS#10 certificate signing request for this key
     * @param {string} subjectDN The X500Name for the certificate request in LDAP(RFC 2253) format
     * @returns {string} PEM-encoded PKCS#10 certificate signing request
     * @throws Will throw an error if this is not a private key
     * @throws Will throw an error if CSR generation fails for any other reason
     */
    generateCSR(subjectDN) {

        console.log("generateCSR: key=", this)
        console.log("generateCSR: subjectDN=", subjectDN)

        // check to see if this is a private key
        if (!this.isPrivate()) {
            throw new Error('A CSR cannot be generated from a public key');
        }

        var algorithm = {
            id: "id-GostR3410-2001",
            name: "GOST R 34.10-2001",
            namedCurve: "S-256-A",
            ukm: this.buffer
        };
        var pkasn1 = gostCrypto.asn1.GostPrivateKeyInfo.encode({
            algorithm: algorithm,
            buffer: this.buffer
        });
        var pkpem = "-----BEGIN PRIVATE KEY-----\n" +
            Buffer.from(pkasn1).toString('base64').match(/.{0,92}/g).join('\n') +
            "-----END PRIVATE KEY-----";

        var csrBuf = libGost.csr(pkpem, /CN=(.+?)(?:,|$)/.exec(subjectDN)[1]);
        var csrStr = Buffer.from(csrBuf).toString();
        var csrOut = csrStr.substr(0, csrStr.indexOf("\0"));

        // Output ready certification request
        console.log("resultCSR=", csrOut);
        return csrOut;
    }

    keyProvider(algorithm) {
        var id = algorithm.id;

        for (var name in gostCrypto.security.providers) {
            var provider = gostCrypto.security.providers[name];
            if (provider.publicKey.id === id) return provider;
        }
    }
}

module.exports =
    GOSTKey;
