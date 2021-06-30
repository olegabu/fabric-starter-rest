const fs = require('fs');
const _ = require('lodash');
const cfg = require('./config.js');
const certsManager = require('./certs-manager');



function addOrg(t, org) {
  if(!t.organizations) {
    t.organizations = {};
  }
  t.organizations[org] = {
    // mspid: `${org}MSP`,
    mspid: `${org}`,
    peers: [
      `${cfg.peerName}.${org}.${cfg.domain}:${cfg.peer0Port}`
    ]
  };

    if (org === cfg.org) {
        const mspPath = certsManager.getMSPConfigDirectory(org);
        const keystorePath = `${mspPath}/keystore`;
        try {
          const keystoreFiles = fs.readdirSync(keystorePath);
          if (keystoreFiles.length) {
            const keyPath = `${keystorePath}/${keystoreFiles[0]}`;
            t.organizations[org].adminPrivateKey = {
              path: keyPath
            };
          }
        } catch(e) {
          console.log('Skipping Admin keystore, not exists: ', keystorePath)
        }

        t.organizations[org].certificateAuthorities = [org];
        t.organizations[org].signedCert = {
            path: `${mspPath}/signcerts/Admin@${cfg.certificationDomain}-cert.pem` //TODO: use certsManager.getSignCertPath()
        };
    }
}

function addPeer(t, org, i, peerAddress) {
  if(!t.peers) {
    t.peers = {};
  }
    const peerName = peerAddress; //`peer${i}.${org}.${cfg.domain}:${cfg.peer0Port}`;
    t.peers[peerName] = {
    url: `grpcs://${peerAddress}`,
    grpcOptions: {
       'ssl-target-name-override': `${cfg.peerName}.${org}.${cfg.domain}`, //`peer${i}.${org}.${cfg.domain}`,
      //'ssl-target-name-override': 'localhost',
    },
    tlsCACerts: {
      path: `${cfg.ORG_CRYPTO_DIR}/peers/${cfg.peerName}.${org}.${cfg.domain}/msp/tlscacerts/tlsca.${org}.${cfg.domain}-cert.pem`//TODO: use certsManager.getTLSxxx
    }
  };
}

function addCA(t, org, caAddress) {
  if(!t.certificateAuthorities) {
    t.certificateAuthorities = {};
  }

  t.certificateAuthorities[org] = {
    url: `https://${caAddress}`,
    httpOptions: {
      verify: false
    },
    tlsCACerts: {
      path: `${cfg.ORG_CRYPTO_DIR}/ca/ca.${org}.${cfg.domain}-cert.pem` //TODO: tlsca?
    },
    registrar: [
      {
        enrollId: cfg.ENROLL_ID,
        enrollSecret: cfg.enrollSecret
      }
    ],
    caName: 'default'
  };
}

function envOptionToSetting(envVarName, optionName, normalizeFactor) {
  const optionValue = Math.round(Number(process.env[envVarName]) / (normalizeFactor ? normalizeFactor : 1));
  return process.env[envVarName] && {[optionName]: optionValue};
}

module.exports = function (cas, storeSubPath='') {
  const t = {
    name: 'Network',
    version: '1.0',
  };

  if (!cas) throw new Error("Certificate Authority is not specified")

  t.orderers= {
    [`${cfg.ORDERER_ADDR}`]: {
      url: `grpcs://${cfg.ORDERER_ADDR}`,
          tlsCACerts: {
            path: certsManager.getOrdererRootTLSFile()
            // path: `${cfg.ORDERER_CRYPTO_DIR}/orderers/orderer.${cfg.ORDERER_DOMAIN}/tls/ca.crt`
      }
    }
  };

  t.client = {
    organization: cfg.org,
    credentialStore: {
      path: `hfc-kvs/${cfg.org}${storeSubPath}`,
      cryptoStore: {
        path: `hfc-cvs/${cfg.org}${storeSubPath}`
      }
    },
    connection: {
      options: {
        // @formatter:off
        ...envOptionToSetting('GRPC_MAX_RECEIVE_MESSAGE_LENGTH', 'grpc.max_receive_message_length'),  //-1
        ...envOptionToSetting('GRPC_MAX_SEND_MESSAGE_LENGTH', 'grpc.max_send_message_length'),         //-1
        ...envOptionToSetting('GRPC_MAX_PINGS_WITHOUT_DATA', 'grpc.max_pings_without_data'), ...envOptionToSetting('GRPC_MAX_PINGS_WITHOUT_DATA', 'grpc.http2.max_pings_without_data'),  //0
        ...envOptionToSetting('GRPC_KEEP_ALIVE_MS', 'grpc.keepalive_time_ms'), ...envOptionToSetting('GRPC_KEEP_ALIVE_MS', 'grpc.http2.keepalive_time', 1000),                   //120000
        ...envOptionToSetting('GRPC_KEEP_ALIVE_TIMEOUT_MS', 'grpc.keepalive_timeout_ms'), ...envOptionToSetting('GRPC_KEEP_ALIVE_TIMEOUT_MS', 'grpc.http2.keepalive_timeout', 1000),        //120000
        ...envOptionToSetting('GRPC_KEEP_ALIVE_PERMIT_WITHOUT_CALLS', 'grpc.keepalive_permit_without_calls'), ...envOptionToSetting('GRPC_KEEP_ALIVE_PERMIT_WITHOUT_CALLS', 'grpc.http2.keepalive_permit_without_calls'), //1

        //set default for 'min_time_between_pings_ms' then set it to the keep alive time, and override if it's set itself (until defaults are updated in fabric-sdk):
        ...envOptionToSetting('GRPC_KEEP_ALIVE_MS', 'grpc.min_time_between_pings_ms', 1.1), ...envOptionToSetting('GRPC_KEEP_ALIVE_MS', 'grpc.http2.min_time_between_pings_ms', 1.1),
        ...envOptionToSetting('GRPC_MIN_TIME_BETWEEN_PINGS_MS', 'grpc.min_time_between_pings_ms'), ...envOptionToSetting('GRPC_MIN_TIME_BETWEEN_PINGS_MS', 'grpc.http2.min_time_between_pings_ms')
        // @formatter:on
      }
    }
  };

  try {
    orgs = JSON.parse(cfg.orgs);
  } catch (e) {
    orgs = JSON.parse('{' + cfg.orgs + '}');
  }

  try {
    cas = JSON.parse(cas);
  } catch (e) {
    cas = JSON.parse('{' + cas + '}');
  }

  Object.keys(orgs).forEach(k => {
    addOrg(t, k);
    // if (!cfg.isOrderer) {
      addPeer(t, k, 0, orgs[k]); //TODO: different peer names are in addOrg and addPeer
    // }
  });

  // if (cfg.isOrderer) {
  //   addOrg(t, cfg.ordererName)
  // }

  Object.keys(cas).forEach(k => {
    addCA(t, k, cas[k]);
  });

  return t;
};
