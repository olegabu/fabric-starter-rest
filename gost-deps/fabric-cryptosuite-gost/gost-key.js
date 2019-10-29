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

    constructor(pem, type) {
        super();
        this.pem = pem;
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

        throw new Error("Not supported yet");

        // // Generate public key from private key
        // let a = this.theKey.algorithm;
        // let algorithm = {
        //     name: a.name,
        //     version: a.version,
        //     length: a.length,
        //     usages: ['sign', 'verify'],
        //     namedCurve: a.namedCurve,
        //     ukm: this.theKey.buffer
        // };
        // //var algorithm = {
        // //    name: 'GOST R 34.10',
        // //    namedCurve: (this.theKey.algorithm || {}).namedCurve || "",
        // //    ukm: this.theKey.buffer
        // //};
        // //if (algorithm.namedCurve.value.indexOf('512') >= 0)
        // //    algorithm.algorithm.name += '-512';
        // //GostCrypto.subtle.generateKey(algorithm, true, ['sign', 'verify']).then(function(keyPair) {
        // //    return keyPair.publicKey;
        // //});
        //
        // let gostsign = GostEngine.getGostSign(algorithm);
        // const keypair = gostsign.generateKey();
        //
        // return new GOSTKey({
        //     type: 'public',
        //     extractable: 'true',
        //     algorithm: algorithm,
        //     usages: 'VERIFY',
        //     buffer: Buffer.from(keypair.publicKey)
        // });
    }

    /**
     * Returns the subject key identifier of this key
     *
     * @returns {string} The subject key identifier of this key as a hexidecial encoded string
     */
    getSKI() {
        let hash = libGost.digest(this.pem);
        return gostCrypto.coding.Hex.encode(hash);
        // let key = this.isPrivate() ? this.getPublicKey() : this;
        // if (!key || !key.theKey || !key.theKey.buffer) throw new Error('getSKI Error: key data is missing');
        // return Hash.SHA2_256(key.theKey.buffer);
    }

    /**
     * Converts this key to its PEM representation, if this operation is allowed.
     *
     * @returns {string} the PEM string representation of the key
     */
    toBytes() {
        return this.pem;
        // throw new Error("Not supported");
        // if (this.isPrivate())
        //     return GostCrypto.asn1.GostPrivateKeyInfo.encode(this.theKey);
        //
        // return GostCrypto.asn1.GostSubjectPublicKeyInfo.encode(this.theKey);
    }
}

module.exports =
    GOSTKey;
