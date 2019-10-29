# GOST CryptoSuite Package for Hyperledger Fabric Node.js SDK

## This package is based on the "custom crypto suite example for Hyperledger Fabric clients"

Below goes the original content README.md from https://github.com/yoheiueda/fabric-watch:

## How to run the custom crypto suite example

### Install required Node.js packages

```
npm install
```

### Bring up a Fabric network

```
docker-compose up -d
```

### Create a channel, and install the example chaincode

```
rm -fr ./store # make sure to clear old files
node app.js setup
```

### How to run the example client

```
node app.js --help
```
Output:
```
Usage: app [options] [command]

Options:
  --user [name]                 User name (default: "admin")
  --profile [path]              Connection profile (default: "./connection-profile.yaml")
  --channel [string]            Channel name
  --org [string]                Organization name
  --peer [string]               Peer name
  --orderer [string]            Orderer name
  --ca-server [string]          CA server name
  --store-path [path]           File store path (default: "./store")
  --crypto-suite [type]         sw, pkcs11, or custom (default: "custom")
  --gopath [path]               gopath for chaincode (default: "./chaincode/go")
  -h, --help                    output usage information

Commands:
  setup
  register <username>
  enroll <username> <secret>
  execute <function> [args...]
  query <function> [args...]
```

### Create a new user at the CA server
```
node app.js register user1
```

Output:
```
Creating a new user at CA server...
Done.

enrollmentID:  user1
enrollmentSecret:  ohZHcygrqxgz
```
Then, enroll with the secret.
```
node app.js enroll user1 ohZHcygrqxgz
```
Output:
```
Generating a pair of public/private keys, and sending Certificate Signing Request with the public key to a CA server...
Done.

Public and private keys are stored in crypto store
User state including certificate is stored in state store
```

You can check the generated certificate with the following command. (`openssl` and `jq` are necessary)
```
jq -r .enrollment.identity.certificate store/statestore/user1 | openssl x509 -noout -text
```

You can get Subject Key Identifier of the public key in the certificate with the following command.
```
jq -r .enrollment.signingIdentity store/statestore/user1
```
Output:
```
37efa3d5215437f699ebcfffb6e8c18d31b6a8ddfdb03f4e50f015b6e56ff908
```
Then, you can check generated public and private keys as follows.
```
ls store/cryptostore/37efa3d5215437f699ebcfffb6e8c18d31b6a8ddfdb03f4e50f015b6e56ff908-*
```
Output:
```
store/cryptostore/37efa3d5215437f699ebcfffb6e8c18d31b6a8ddfdb03f4e50f015b6e56ff908-priv
store/cryptostore/37efa3d5215437f699ebcfffb6e8c18d31b6a8ddfdb03f4e50f015b6e56ff908-pub
```

### Run transactions with the new user
The following example calls chaincode function `put` with arguments `["abc", "123"]`.
```
node app.js --user user1 execute put abc 123
```
Output:
```
Sending a signed transaction proposal with the certificate of user1...
Done.

Response status:  200
Response payload:
```

The following example calls chaincode function `get` with an argument `["abc"]`.
```
node app.js --user user1 query get abc
```
Output:
```
Sending a signed transaction proposal with the certificate of user1...
Done.

Response status:  200
Response payload: 123
```

## How to customize crypto suite and crypto key store

In `app.js`, classes `CustomCryptoSuite` and `CustomKeyValueStore` are defined as follows.
You can customize these classes as you like.

```
class CustomCryptoSuite {
    // Derived from fabric-client/lib/api.js
    constructor() {
        this.impl = new swCryptoStore(256, 'SHA2');
    }

    generateKey(opts) {
        return this.impl.generateKey(opts);
    }

    generateEphemeralKey() {
        return this.impl.generateEphemeralKey();
    }

    deriveKey(key, opts) {
        return this.impl.deriveKey(key, opts);
    }

    importKey(pem, opts) {
        return this.impl.importKey(pem, opts);
    }

    getKey(ski) {
        return this.impl.getKey(ski)
    }

    hash(msg, opts) {
        return this.impl.hash(msg, opts);
    }

    sign(key, digest) {
        return this.impl.sign(key, digest);
    }

    verify(key, signature, digest) {
        return this.impl.verify(key, signature, digest);
    }

    encrypt(key, plaintext, opts) {
        return this.impl.encrypt(key, plaintext, opts);
    }

    decrypt(key, ciphertext, opts) {
        return this.impl.decrypt(key, ciphertext, opts);
    }

    setCryptoKeyStore(cryptoKeyStore) {
        this._cryptoKeyStore = cryptoKeyStore;
        return this.impl.setCryptoKeyStore(cryptoKeyStore)
    }
}

class CustomKeyValueStore {
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
```

## How to use pkcs11 crypto suite with SoftHSM

### Reset fabric setup
```
docker-compose down
docker-compose up -d
rm -fr ./store
```
### Install SoftHSM and OpenSC tools
On Mac:
```
brew install softhsm opensc
```

### Set up SoftHSM
```
mkdir -p store/softhsm
echo directories.tokendir=$PWD/store/softhsm > softhsm.conf
export SOFTHSM2_CONF=$PWD/softhsm.conf
softhsm2-util --init-token --slot 0 --label "ForFabric" --so-pin 1234 --pin 98765432
export CRYPTO_PKCS11_LIB=/usr/local/lib/softhsm/libsofthsm2.so
export CRYPTO_PKCS11_SLOT=0
export CRYPTO_PKCS11_PIN=98765432
```

### Set up fabric
```
node app.js setup
```

### Run client commands

Use with the `--crypto-suite pkcs11` option.
```
node app.js --crypto-suite pkcs11 register user1
node app.js --crypto-suite pkcs11 enroll user1 <secret>
node app.js --crypto-suite pkcs11 --user user1 execute put abc 123
```

You can get Subject Key Identifier of the public key in the certificate with the following command.
```
jq -r .enrollment.signingIdentity store/statestore/user1
```
Output:
```
c1e571438a89a8fff0acbbdfff7783f288922889d0c78f18d611294466d469f0
```
Then, you can identify generated public and private keys as follows.
```
pkcs11-tool --module /usr/local/lib/softhsm/libsofthsm2.so --pin 98765432 --list-objects
```
Output:
```
Using slot 0 with a present token (0x201040a)
Private Key Object; EC
  label:      c1e571438a89a8fff0acbbdfff7783f288922889d0c78f18d611294466d469f0
  ID:         c1e571438a89a8fff0acbbdfff7783f288922889d0c78f18d611294466d469f0
  Usage:      decrypt, sign, unwrap, derive
Public Key Object; EC  EC_POINT 256 bits
  EC_POINT:   044104f66d0676f8663146ff44461e5797bd3918924da36d923567a84966663a8209f1478546587415fa8e05559eb0f421602895a136138470d57af4c4e33078fafa76
  EC_PARAMS:  06082a8648ce3d030107
  label:      c1e571438a89a8fff0acbbdfff7783f288922889d0c78f18d611294466d469f0
  ID:         c1e571438a89a8fff0acbbdfff7783f288922889d0c78f18d611294466d469f0
  Usage:      encrypt, verify, wrap
Public Key Object; EC  EC_POINT 256 bits
  EC_POINT:   04410472a5d97e5f3ff71b2e074881cab8571dd0aae89327223c3b7d2348e18adf5134a0f5a7766d61f182d616ebd4a72eb41399ae44d74c348b33721f21bc3c06de19
  EC_PARAMS:  06082a8648ce3d030107
  label:      dde4724caa26577e44d14c647e238d16b9ab000f7bf2fbbe18b021e9a8242a64
  ID:         dde4724caa26577e44d14c647e238d16b9ab000f7bf2fbbe18b021e9a8242a64
  Usage:      encrypt, verify, wrap
Private Key Object; EC
  label:      dde4724caa26577e44d14c647e238d16b9ab000f7bf2fbbe18b021e9a8242a64
  ID:         dde4724caa26577e44d14c647e238d16b9ab000f7bf2fbbe18b021e9a8242a64
  Usage:      decrypt, sign, unwrap, derive
```