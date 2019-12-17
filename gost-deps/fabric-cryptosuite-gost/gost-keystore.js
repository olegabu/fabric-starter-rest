/*
 Copyright 2016, 2018 IBM All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0

*/

'use strict';

const utils = require('fabric-client/lib/utils.js');
const CryptoKeyStore = require('fabric-client/lib/impl/CryptoKeyStore.js');
const GOSTKey = require('./gost-key.js');
const GOST_R_34 = require('./GOST_R_34.js');

/*
 * The mixin enforces the special indexing mechanism with private and public
 * keys on top of a standard implementation of the KeyValueStore interface
 * with the getKey() and putKey() methods
 */
const CryptoKeyStoreMixin = (KeyValueStore) => class extends KeyValueStore {
	getKey(ski) {
		const self = this;

		// first try the private key entry, since it encapsulates both
		// the private key and public key
		return this.getValue(_getKeyIndex(ski, true))
			.then((raw) => {
				if (raw !== null) {
					const privKey = GOST_R_34.loadKeyFromPEM(raw);
					// TODO: for now assuming GOST keys only, need to add support for ECDSA keys
					return new GOSTKey(privKey);
				}

				// didn't find the private key entry matching the SKI
				// next try the public key entry
				return self.getValue(_getKeyIndex(ski, false));
			}).then((key) => {
				if (key instanceof GOSTKey) {
					return key;
				}

				if (key !== null) {
					const pubKey = GOST_R_34.loadKeyFromPEM(key);
					return new GOSTKey(pubKey);
				}
			});
	}

	putKey(key) {
		const idx = _getKeyIndex(key.getSKI(), key.isPrivate());
		const pem = key.toBytes();
		return this.setValue(idx, pem)
			.then(() => {
				return key;
			});
	}
};

/**
 * A GostCryptoKeyStore uses an underlying instance of {@link module:api.KeyValueStore} implementation
 * to persist crypto keys.
 *
 * @param {function} KVSImplClass Optional. The built-in key store saves private keys.
 *    The key store may be backed by different {@link KeyValueStore} implementations.
 *    If specified, the value of the argument must point to a module implementing the
 *    KeyValueStore interface.
 * @param {Object} opts Implementation-specific option object used in the constructor
 *
 * @class
 */
const GostCryptoKeyStore = function(KVSImplClass, opts) {
	let superClass;

	if (typeof KVSImplClass !== 'function') {
		let impl_class = utils.getConfigSetting('crypto-value-store');
		if (!impl_class) {
			impl_class = utils.getConfigSetting('key-value-store');
		}
		superClass = require(impl_class);
	} else {
		superClass = KVSImplClass;
	}

	if (KVSImplClass !== null && typeof opts === 'undefined') {
		// the function is called with only one argument for the 'opts'
		opts = KVSImplClass;
	}

	const MyClass = class extends CryptoKeyStoreMixin(superClass) {};
	return new MyClass(opts);
};

function _getKeyIndex(ski, isPrivateKey) {
	if (isPrivateKey) {
		return ski + '-priv';
	} else {
		return ski + '-pub';
	}
}

module.exports = GostCryptoKeyStore;

/*
class GostKeyValueStore {
	// Derived from fabric-client/lib/impl/FileKeyValueStore.js

	constructor(options) {
		if (!options || !options.path) {
			throw new Error('Must provide the path to the directory to hold files for the store.');
		}

		const self = this;
		this._dir = options.path;
		return new Promise(((resolve, reject) => {
			fs.mkdirs(self._dir, (err) => {
				if (err) {
					logger.error('constructor, error creating directory, code: %s', err.code);
					return reject(err);
				}
				return resolve(self);
			});
		}));
	}

	getValue(name) {
		logger.debug('getValue', { key: name });

		const self = this;

		return new Promise(((resolve, reject) => {
			const p = path.join(self._dir, name);
			fs.readFile(p, 'utf8', (err, data) => {
				if (err) {
					if (err.code !== 'ENOENT') {
						return reject(err);
					} else {
						return resolve(null);
					}
				}
				return resolve(data);
			});
		}));
	}

	setValue(name, value) {
		logger.debug('setValue', { key: name });

		const self = this;

		return new Promise(((resolve, reject) => {
			const p = path.join(self._dir, name);
			fs.writeFile(p, value, (err) => {
				if (err) {
					reject(err);
				} else {
					return resolve(value);
				}
			});
		}));
	}
};

module.exports =
    GostKeyValueStore;
*/