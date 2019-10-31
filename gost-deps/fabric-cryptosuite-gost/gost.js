// Author: Yohei Ueda <yohei@jp.ibm.com>
// GOST: Alexander Olkhovoy <ao@ze1.org>


const fs = require('fs-extra');
const path = require('path');

const sdkUtils = require('fabric-client/lib/utils.js');
const logger = sdkUtils.getLogger('GostCryptoSuite');

const api = require('fabric-client/lib/api.js');

const gostDist = require('crypto-gost/dist/CryptoGost.js');
const gostCrypto = gostDist.CryptoGost;
const gostEngine = gostDist.GostEngine;

const libGost = require('./lib-fabric-gost.js');

const GOST_R_34_10 = 'GOST R 34.10';
const GOST_R_34 = require('./GOST_R_34.js');
const GostCryptoKeyStore = require('./gost-keystore.js');
const GOSTKey = require('./gost-key.js');

// Derived from fabric-client/lib/api.js
class GostCryptoSuite extends api.CryptoSuite {

    constructor(keysize, hashAlgo, opts) {
        super();
        this.setCryptoKeyStore(!!opts && !!opts.keystore ? opts.keystore : new GostCryptoKeyStore({path: './crypto-config'}));
        logger.debug(`New instance of GostCryptoSuite created [KeySize: ${keysize}, HashAlgo: ${hashAlgo}, Opts: ${JSON.stringify(opts)}]`);
    }

    /**
     * Generate a key using the options in <code>opts</code>. If the <code>opts.ephemeral</code>
     * parameter is false, the method, in addition to returning the imported {@link Key}
     * instance, also persists the generated key in the key store as PEM files that can be
     * retrieved using the <code>getKey()</code> method
     *
     * @param {KeyOpts} opts Optional
     * @returns {module:api.Key} Promise for an instance of the Key class
     * @throws Will throw an error if not implemented
     */
    generateKey(opts) {
        throw Error("Not implemented yet!")
        // logger.debug(`Generating new key, options:\n${opts}\n`);
        // let store = opts ? (opts.ephemeral === false ? this._cryptoKeyStore : undefined) : undefined;
        // return gostCrypto.subtle.generateKey(GOST_R_34_10, true, ['sign', 'verify'])
        //     .then(keyPair => {
        //         logger.debug(`Generated keyPair: ${JSON.stringify(keyPair)}`);
        //         return gostCrypto.subtle.exportKey('raw', keyPair.privateKey);
        //     })
        //     .then(privateKey => {
        //         logger.debug(`Extracted private key: ${JSON.stringify(privateKey)}`);
        //         let theKey = new GOSTKey(privateKey);
        //         if (store) {
        //             return store._getKeyStore()
        //                 .then(ks => {
        //                     ks.putKey(theKey);
        //                     return theKey;
        //                 });
        //         }
        //         return theKey;
        //     });
    }

    /**
     * Generate an ephemeral key.
     *
     * @returns {module:api.Key} An instance of the Key class
     * @throws Will throw an error if not implemented
     */
    generateEphemeralKey() {
        return this.generateKey({ephemeral: true});
    }

    /**
     * Derives the new private key from the source public key using the parameters passed in the <code>opts</code>.
     * This operation is needed for deriving private keys corresponding to the Transaction Certificates.
     *
     * @param {module:api.Key} key The source key
     * @param {KeyOpts} opts Optional
     * @returns {module:api.Key} Derived key
     */
    deriveKey(key, opts) {
        throw new Error("Not implemented yet!");
    }

    /**
     * Imports a {@link Key} from its raw representation using <code>opts</code>. If the <code>opts.ephemeral</code>
     * parameter is false, the method, in addition to returning the imported {@link Key}
     * instance, also saves the imported key in the key store as PEM files that can be
     * retrieved using the 'getKey()' method
     *
     * @param {string} pem PEM string of the key to import
     * @param {KeyOpts} opts Optional
     * @returns {Key | Promise} If "opts.ephemeral" is true, returns the Key class synchronously.
     *          If "opts.ephemeral" not set or false, returns a Promise of an instance of the
     *          Key class.
     */
    importKey(pem, opts) {
        logger.debug(`Importing key:\n${pem}\n`);
        let isCert = pem.indexOf('CERTIFICATE');
        let store = opts ? (opts.ephemeral === false ? this._cryptoKeyStore : undefined) : undefined;
        // let key = libGost.loadKeyFromPEM(pem);
        // logger.debug(`Loaded key: ${JSON.stringify(key)}`);
        let theKey = new GOSTKey(pem, isCert ? 'public' : 'private' );
        logger.debug(`Loaded key: ${JSON.stringify(theKey)}`);
        if (store) {
            return store._getKeyStore()
                .then(ks => {
                    ks.putKey(theKey);
                    return theKey;
                });
        }
        return theKey;
    }


    /**
     * Returns the {@link Key} this implementation associates to the Subject Key Identifier ski.
     *
     * @param {string} ski Subject Key Identifier specific to a Crypto Suite implementation, as the
     *    unique index to represent the key
     * @returns {module:api.Key} Promise of an instance of the Key class corresponding to the ski
     */
    getKey(ski) {
        logger.debug(`Get key, SKI: ${JSON.stringify(ski)}`);
        return this._cryptoKeyStore._getKeyStore()
            .then(store => {
                return store.get(ski);
            });
    }

    /**
     * Produce a hash of the message <code>msg</code> using options <code>opts</code>
     *
     * @param {string} msg Source message to be hashed
     * @param {Object} opts
     *      algorithm: an identifier for the algorithm to be used, such as "SHA3"
     * @returns {string} The hashed digest in hexidecimal string encoding
     */
    hash(msg, opts) {
        let hash = libGost.digest(msg);
        let hex = gostCrypto.coding.Hex.encode(hash);
        logger.debug(`Hashing:`);
        logger.debug(`\tMESSAGE:\n${gostCrypto.coding.Hex.encode(hash)}\n`);
        logger.debug(`\tDIGEST: ${hex}`);
        return hex;
    }

    /**
     * Signs digest using key. The opts argument should be appropriate for the algorithm used.
     *
     * @param {module:api.Key} key Signing key (private key)
     * @param {byte[]} digest The message digest to be signed. Note that when a
     * signature of a larger message is needed, the caller is responsible
     * for hashing the larger message and passing the hash (as digest) to sign.
     * @returns {byte[]} the resulting signature
     */
    sign(key, digest) {
        let theKey = key.pem;
        let content = Buffer.from(digest);
        let signature = libGost.sign(theKey, content);
        logger.debug(`Signing:`);
        logger.debug(`\tKEY TYPE: ${JSON.stringify(key.type)}`);
        logger.debug(`\tDIGEST: ${gostCrypto.coding.Hex.encode(content)}`);
        logger.debug(`\tSIGNATURE:\n${gostCrypto.coding.Hex.encode(Buffer.from(signature))}\n`);
        return signature;
    }

    /**
     * Verifies signature against key and digest
     *
     * @param {module:api.Key} key Signing verification key (public key)
     * @param {byte[]} sign The signature to verify
     * @param {byte[]} digest The digest that the signature was created for
     * @returns {boolean} true if the signature verifies successfully
     */
    verify(key, sign, digest) {
        let theKey = key.pem;
        let content = Buffer.from(digest);
        let signature = new Buffer(sign);
        logger.debug(`Verify:\n\tKEY: ${JSON.stringify(key.type)}\n\tSIGNATURE: ${JSON.stringify(signature)}\n\tDIGEST: ${JSON.stringify(content)}\n`);
        return libGost.verify(theKey, signature, content);
    }

    /**
     * Encrypts plaintext using key.
     * The opts argument should be appropriate for the algorithm used.
     *
     * @param {module:api.Key} key Encryption key (public key)
     * @param {byte[]} plainText Plain text to encrypt
     * @param {Object} opts Encryption options
     * @returns {byte[]} Cipher text after encryption
     */
    encrypt(key, plaintext, opts) {
        logger.debug(`Encrypt: ${JSON.stringify(opts)}`);
        // TODO: implement
        throw new Error('Function `encrypt` is not implemented.');
    }

    /**
     * Decrypts ciphertext using key.
     * The opts argument should be appropriate for the algorithm used.
     *
     * @param {module:api.Key} key Decryption key (private key)
     * @param {byte[]} cipherText Cipher text to decrypt
     * @param {Object} opts Decrypt options
     * @returns {byte[]} Plain text after decryption
     */
    decrypt(key, ciphertext, opts) {
        logger.debug(`Decrypt: ${JSON.stringify(opts)}`);
        // TODO: implement
        throw new Error('Function `decrypt` is not implemented.');
    }

    /**
     * Set the cryptoKeyStore.
     *
     * When the application needs to use a key store other than the default,
     * it should use the {@link Client} newCryptoKeyStore to create an instance and
     * use this function to set the instance on the CryptoSuite.
     *
     * @param {CryptoKeyStore} cryptoKeyStore The cryptoKeyStore.
     * @abstract
     */
    setCryptoKeyStore(cryptoKeyStore) {
        this._cryptoKeyStore = cryptoKeyStore;
    }

}

module.exports =
    GostCryptoSuite;

// /**
//  * This module implements the {@link module:api.Key} interface, for GOSTCryptoSuite.
//  * @class GOST_KEY
//  * @extends module:api.Key
//  */
// class GostKey extends api.Key {
//
//     /**
//      * this class represents the private or public key of an GOST key pair.
//      *
//      * @param {Object} key This must be the "privKeyObj" or "pubKeyObj" part of the object generated by jsrsasign.KEYUTIL.generateKeypair()
//      */
//     constructor(key) {
//         if (!key) throw new Error('The `key` parameter is required');
//         if (!key.type || (key.type !== 'private' && key.type !== 'public')) throw new Error('The `key.type` parameter must be either `private` or `public`.');
//         super();
//         this._key = key;
//     }
//
//     /**
//      * @returns {string} a string representation of the hash from a sequence based on the private key bytes
//      */
//     getSKI() {
//         if (!this._key || !this._key.KeyType)
//             throw new Error('The `_key` is missing from object');
//
//         return this._key.subjectKeyIdentifier;
//
//         /*let buff;
//         const pointToOctet = function (key) {
//             const byteLen = (key.ecparams.keylen + 7) >> 3;
//             const newBuff = Buffer.allocUnsafe(1 + 2 * byteLen);
//             newBuff[0] = 4; // uncompressed point (https://www.security-audit.com/files/x9-62-09-20-98.pdf, section 4.3.6)
//             const xyhex = key.getPublicKeyXYHex();
//             const xBuffer = Buffer.from(xyhex.x, 'hex');
//             const yBuffer = Buffer.from(xyhex.y, 'hex');
//             logger.debug('ECDSA curve param X: %s', xBuffer.toString('hex'));
//             logger.debug('ECDSA curve param Y: %s', yBuffer.toString('hex'));
//             xBuffer.copy(newBuff, 1 + byteLen - xBuffer.length);
//             yBuffer.copy(newBuff, 1 + 2 * byteLen - yBuffer.length);
//             return newBuff;
//         };
//         if (this._key.isPublic) {
//             // referencing implementation of the Marshal() method of https://golang.org/src/crypto/elliptic/elliptic.go
//             buff = pointToOctet(this._key);
//         } else {
//             buff = pointToOctet(this.getPublicKey()._key);
//         }
//         // always use SHA256 regardless of the key size in effect
//         return Hash.SHA2_256(buff);*/
//     }
//
//     isSymmetric() {
//         return !!this._key && this._key.KeyType === 'secret';
//     }
//
//     isPrivate() {
//         return !!this._key && this._key.KeyType === 'private';
//     }
//
//     getPublicKey() {
//
//         // Return `this` key if it's type is `public`
//         if (!!this._key && this._key.KeyType === 'public') return this;
//
//         // Error if not a private key
//         if (!!this._key && this._key.KeyType !== 'private') throw new Error('The key type is not private nor public.');
//
//         /*if (this._key.KeyType === 'private') {
// 			const f = new ECDSA({curve: this._key.curveName});
// 			f.setPublicKeyHex(this._key.pubKeyHex);
// 			f.isPrivate = false;
// 			f.isPublic = true;23
// 			return new ECDSA_KEY(f);
//         }*/
//
//         // Calculate public key using specific to the named curve params
//         var algorithm = {
//             name: 'GOST R 34.10' +
//                 (this._key.KeyAlgorithm.curve.indexOf('01') < 0 ? '' : '-512') +
//                 (this._key.KeyAlgorithm.curve.indexOf('512') < 0 ? '' : '-512'),
//             namedCurve: this._key.KeyAlgorithm.namedCurve
//         };
//
//
//         // Preset if private key already defined
//         if (this.textContent)
//             algorithm.ukm = gostCoding.Hex.decode(privateKey.textContent);
//
//         // Generate keys
//         gostSubtle.generateKey(algorithm, true, ['sign', 'verify']).then(function (keyPair) {
//             // Store key in secluded place
//             return gostSubtle.exportKey('raw', keyPair.privateKey).then(function (result) {
//                 privateKey.textContent = gostCoding.Hex.encode(result);
//                 // Provide the public key to recepient
//                 return gostSubtle.exportKey('raw', keyPair.publicKey).then(function (result) {
//                     publicKey.textContent = gostCoding.Hex.encode(result);
//                 });
//             });
//         });
//
//     }
//
//     /**
//      * Generates a CSR/PKCS#10 certificate signing request for this key
//      * @param {string} subjectDN The X500Name for the certificate request in LDAP(RFC 2253) format
//      * @returns {string} PEM-encoded PKCS#10 certificate signing request
//      * @throws Will throw an error if this is not a private key
//      * @throws Will throw an error if CSR generation fails for any other reason
//      */
//     generateCSR(subjectDN) {
//
//         // check to see if this is a private key
//         if (!this.isPrivate()) {
//             throw new Error('A CSR cannot be generated from a public key');
//         }
//
//         try {
//             /*const csr = asn1.csr.CSRUtil.newCSRPEM({
//                 subject: {str: asn1.x509.X500Name.ldapToOneline(subjectDN)},
//                 sbjpubkey: this.getPublicKey()._key,
//                 sigalg: 'SHA256withECDSA',
//                 sbjprvkey: this._key
//             });*/
//             return csr;
//         } catch (err) {
//             throw err;
//         }
//     }
//
//     /**
//      * Generates a self-signed X.509 certificate
//      * @param {string} [commonName] The common name to use as the subject for the X509 certificate
//      * @returns {string} PEM-encoded X.509 certificate
//      * @throws Will throw an error if this is not a private key
//      * @throws Will throw an error if X.509 certificate generation fails for any other reason
//      */
//     generateX509Certificate(commonName) {
//
//         let subjectDN = '/CN=self';
//         if (commonName) {
//             subjectDN = '/CN=' + commonName;
//         }
//         // check to see if this is a private key
//         if (!this.isPrivate()) {
//             throw new Error('An X509 certificate cannot be generated from a public key');
//         }
//
//         try {
//             // Create CA certificate with these parameters
//             var cert = new gostCrypto.cert.X509({
//                 subject: {
//                     //countryName: 'RU',
//                     //stateOrProvinceName: 'Moscow',
//                     //organizationName: organizationName.value,
//                     //organizationalUnitName: organizationalUnitName.value,
//                     commonName: commonName ? commonName : 'self'
//                 },
//                 extensions: {
//                     keyUsage: ['digitalSignature', 'nonRepudiation', 'keyCertSign', 'cRLSign'],
//                     extKeyUsage: ['clientAuth']
//                 },
//                 days: 365,
//                 subjectPublicKeyInfo: this.getPublicKey()._key,
//             });
//             cert.sign(this._key);
//             cert.textContent = cert.encode('PEM') + '\r\n\r\n' + cert.textContent;
//             return cert.textContent;
//
//         } catch (err) {
//             throw err;
//         }
//     }
//
//     toBytes() {
//         // this is specific to the private key format generated by
//         // npm module 'jsrsasign.KEYUTIL'
//         if (this.isPrivate()) {
//             return this._key.encode('PEM');
//             //return KEYUTIL.getPEM(this._key, 'PKCS8PRV');
//         } else {
//             return this._key.encode('PEM');
//             //return KEYUTIL.getPEM(this._key);
//         }
//     }
// }
//
// class App {
//
//     constructor(user, profile, storePath, channel, org, caServer, orderer, peer, gopath, cryptoSuite) {
//
//         const conf = yaml.safeLoad(fs.readFileSync(profile, 'utf8'));
//
//         function getFromProfile(name) {
//             const keys = Object.keys(conf[name] || {});
//             if (keys.length === 1) {
//                 return keys[0];
//             }
//             if (keys.length < 1) {
//                 console.error('No %s are defined in %s', name, profile);
//             } else if (keys > 1) {
//                 exp
//                 console.error('Multiple %s are defined in %s. Please use --org option', name, profile);
//             }
//             throw new Error('Failed to initialize client.');
//         }
//
//         if (org === undefined) {
//             org = getFromProfile('organizations');
//         }
//         if (channel === undefined) {
//             channel = getFromProfile('channels');
//         }
//         if (caServer === undefined) {
//             caServer = getFromProfile('certificateAuthorities');
//         }
//         if (orderer === undefined) {
//             orderer = getFromProfile('orderers');
//         }
//         if (peer === undefined) {
//             peer = getFromProfile('peers');
//         }
//
//         this.user = user;
//         this.profile = profile;
//         this.storePath = storePath;
//         this.channel = channel;
//         this.org = org;
//         this.caServer = caServer;
//         this.orderer = orderer;
//         this.peer = peer;
//         this.cryptoSuite = cryptoSuite;
//
//         process.env.GOPATH = gopath;
//     }
//
//     async getClient() {
//
//         const client = new SDK();
//
//         // Set up crypto store that contains user's public and private keys
//         let cryptoSuite;
//         switch (this.cryptoSuite) {
//             case 'gost':
//             case 'gost-sw':
//                 cryptoSuite = new GostCryptoSuite();
//                 break;
//             case 'sw':
//                 cryptoSuite = new SoftwareCryptoSuite(256, 'SHA2');
//                 break;
//             case 'pkcs11':
//                 cryptoSuite = new PKCS11CryptoSuite(256, 'SHA2');
//                 break;
//             default:
//                 throw new Error(sprintf('Unknown crypto suite: %s, expected one of: sw, pkcs11, gost.', this.cryptoSuite));
//         }
//
//         cryptoSuite.setCryptoKeyStore(SDK.newCryptoKeyStore(GostKeyValueStore, {path: this.storePath + "/cryptostore"}));
//         client.setCryptoSuite(cryptoSuite);
//
//         // Set up state store that contains certificates
//         client.setStateStore(await new GostKeyValueStore({path: this.storePath + "/statestore"}));
//
//         client.loadFromConfig(this.profile);
//         return client;
//     }
//
//     async setup() {
//         const client = await this.getClient();
//
//         console.log('Creating channel "' + this.channel + '"...');
//         const envelope = fs.readFileSync(channelConfigPath);
//         const channelConfig = client.extractChannelConfig(envelope);
//         const sign = await client.signChannelConfig(channelConfig);
//         const channelRequest = {
//             name: this.channel,
//             orderer: client.getOrderer(this.orderer),
//             config: channelConfig,
//             signatures: [sign],
//             txId: client.newTransactionID(true)
//         };
//         let result = await client.createChannel(channelRequest)
//         if (!(result && result.status === 'SUCCESS')) {
//             throw new Error(sprintf('Failed to create a channel: %j', result));
//         }
//
//         console.log('Joining the channel ...');
//         const channel = client.getChannel(this.channel);
//         const genesisBlockRequest = {
//             orderer: client.getOrderer(this.orderer),
//             txId: client.newTransactionID(true)
//         };
//         const genesisBlock = await channel.getGenesisBlock(genesisBlockRequest);
//         const joinRequest = {
//             txId: client.newTransactionID(true),
//             block: genesisBlock
//         };
//         let results = await channel.joinChannel(joinRequest);
//         if (results.filter(res => !res || res instanceof Error || !res.response || res.response.status !== 200).length > 0) {
//             throw new Error(sprintf('Failed to join a channel: %j', results));
//         }
//
//         console.log('Installing chaincode...');
//         const installRequest = {
//             targets: [client.getPeer(this.peer)],
//             chaincodePath: chaincodePath,
//             chaincodeId: chaincodeId,
//             chaincodeVersion: chaincodeVersion,
//             chaincodeType: chaincodeType
//         };
//         results = await client.installChaincode(installRequest);
//         if (results[0].filter(res => !res || res instanceof Error || !res.response || res.response.status !== 200).length > 0) {
//             throw new Error(sprintf('Failed to install chaincode: %j', results));
//         }
//
//         console.log('Instantiating chaincode...');
//         const instantiateRequest = {
//             targets: [client.getPeer(this.peer)],
//             chaincodeId: chaincodeId,
//             chaincodeType: chaincodeType,
//             chaincodeVersion: chaincodeVersion,
//             args: [],
//             txId: client.newTransactionID(true),
//         };
//         const timeoutMS = 300000;
//         const responses = await channel.sendInstantiateProposal(instantiateRequest, timeoutMS);
//         if (responses[0].filter(res => !res || res instanceof Error || !res.response || res.response.status !== 200).length > 0) {
//             throw new Error(sprintf('Failed to instantiate chaincode: %j', results));
//         }
//         const transactionRequest = {
//             txId: client.newTransactionID(true),
//             orderer: client.getOrderer(this.orderer),
//             proposalResponses: responses[0],
//             proposal: responses[1]
//         };
//         result = await channel.sendTransaction(transactionRequest);
//         if (!(result && result.status === 'SUCCESS')) {
//             throw new Error(sprintf('Failed to create a channel: %j', result));
//         }
//     }
//
//     async register(username) {
//         console.log('Creating a new user at CA server...');
//
//         const client = await this.getClient();
//         const ca = client.getCertificateAuthority();
//         const registrar = ca.getRegistrar();
//         const adminUser = await client.setUserContext({username: registrar.enrollId, password: registrar.enrollSecret});
//         const registerRequest = {
//             enrollmentID: username,
//             affiliation: 'org1.department1'
//         };
//         const secret = await ca.register(registerRequest, adminUser);
//
//         console.log('Done.\n');
//         console.log('enrollmentID: ', username);
//         console.log('enrollmentSecret: ', secret);
//     }
//
//     async enroll(username, secret) {
//         console.log('Generating a pair of public/private keys, and sending Certificate Signing Request with the public key to a CA server...');
//
//         const client = await this.getClient();
//         await client.setUserContext({username: username, password: secret});
//
//         console.log('Done.\n');
//         console.log('Public and private keys are stored in crypto store');
//         console.log('User state including certificate is stored in state store');
//     }
//
//     async execute(fcn, args) {
//         console.log('Sending a signed transaction proposal with the certificate of %s...', this.user);
//
//         const client = await this.getClient();
//         await client.getUserContext(this.user, true);
//         const channel = client.getChannel(this.channel);
//         const tx_id = client.newTransactionID();
//
//         const proposalRequest = {
//             targets: [client.getPeer(this.peer)],
//             chaincodeId: chaincodeId,
//             fcn: fcn,
//             args: args,
//             txId: tx_id
//         };
//         const responses = await channel.sendTransactionProposal(proposalRequest);
//         if (responses[0].filter(res => !res || res instanceof Error || !res.response || res.response.status !== 200).length > 0) {
//             throw new Error(sprintf('Failed to call sendTransactionProposal: %j', responses[0]));
//         }
//
//         const orderer_request = {
//             txId: tx_id,
//             orderer: client.getOrderer(this.orderer),
//             proposalResponses: responses[0],
//             proposal: responses[1],
//         };
//         const result = await channel.sendTransaction(orderer_request);
//         if (!(result && result.status === 'SUCCESS')) {
//             throw new Error(sprintf('Failed to create a channel: %j', result));
//         }
//         console.log("Done.\n");
//         console.log("Response status: ", responses[0][0].response.status);
//         console.log("Response payload: %s", responses[0][0].response.payload);
//     }
//
//     async query(fcn, args) {
//         console.log('Sending a signed transaction proposal with the certificate of %s...', this.user);
//
//         const client = await this.getClient();
//         await client.getUserContext(this.user, true);
//         const channel = client.getChannel(this.channel);
//         const txid = client.newTransactionID();
//
//         const proposalRequest = {
//             targets: [client.getPeer(this.peer)],
//             chaincodeId: chaincodeId,
//             fcn: fcn,
//             args: args,
//             txId: txid
//         };
//         const responses = await channel.sendTransactionProposal(proposalRequest);
//         if (responses[0].filter(res => !res || res instanceof Error || !res.response || res.response.status !== 200).length > 0) {
//             throw new Error(sprintf('Failed to call sendTransactionProposal: %j', responses[0]));
//         }
//
//         console.log('Done.\n');
//         console.log('Response status: ', responses[0][0].response.status);
//         console.log('Response payload: ', responses[0][0].response.payload);
//     }
//
// }; // class App
//
// function dispatch(methodName) {
//     return function () {
//         const app = new App(
//             program.user,
//             program.profile,
//             program.storePath,
//             program.channel,
//             program.org,
//             program.caServer,
//             program.orderer,
//             program.peer,
//             program.gopath,
//             program.cryptoSuite
//         );
//         const method = app[methodName];
//         method
//             .apply(app, Array.prototype.slice.call(arguments, 0, arguments.length - 1))
//             .then(() => {
//                 process.exit(0);
//             })
//             .catch(err => {
//                 console.error('Process exited with error: ', err.message, err.stack);
//                 process.exit(1);
//             });
//     };
// };
//
// /**
//  * Merge defaults with user options
//  * @private
//  * @param {Object} defaults Default settings
//  * @param {Object} options User options
//  * @returns {Object} Merged values of defaults and options
//  */
// var extend = function (defaults, options) {
//     var extended = {};
//     var prop;
//     for (prop in defaults) {
//         if (Object.prototype.hasOwnProperty.call(defaults, prop)) {
//             extended[prop] = defaults[prop];
//         }
//     }
//     for (prop in options) {
//         if (Object.prototype.hasOwnProperty.call(options, prop)) {
//             extended[prop] = options[prop];
//         }
//     }
//     return extended;
// }
//
// // Utilitly method to make sure the start and end markers are correct
// function makeRealPem(pem) {
//     let result = null;
//     if (typeof pem === 'string') {
//         result = pem.replace(/-----BEGIN -----/, '-----BEGIN CERTIFICATE-----');
//         result = result.replace(/-----END -----/, '-----END CERTIFICATE-----');
//         result = result.replace(
//             /-----([^-]+) ECDSA ([^-]+)-----([^-]*)-----([^-]+) ECDSA ([^-]+)-----/,
//             '-----$1 EC $2-----$3-----$4 EC $5-----'
//         );
//     }
//     return result;
// }
//
// function main() {
//
//     program
//         .option('--user [username]', 'User name', 'admin')
//         .option('--profile [filepath]', 'Connection profile', './connection-profile.yaml')
//         .option('--channel [string]', 'Channel name')
//         .option('--org [string]', 'Organization name')
//         .option('--peer [string]', 'Peer name')
//         .option('--orderer [string]', 'Orderer name')
//         .option('--ca-server [string]', 'CA server name')
//         .option('--store-path [string]', 'File store path', './store')
//         .option('--crypto-suite [string]', 'sw, pkcs11, gost', 'gost')
//         .option('--gopath [path]', 'gopath for chaincode', './chaincode/go')
//
//         .command('setup [args...]').action(dispatch('setup'))
//         .command('register <username>').action(dispatch('register'))
//         .command('enroll <username> <secret>').action(dispatch('enroll'))
//         .command('execute <function> [args...]').action(dispatch('execute'))
//         .command('query <function> [args...]').action(dispatch('query'));
//
//     program
//         .parse(process.argv);
// }
//
// main();
