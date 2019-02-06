const fs = require('fs');
const cfg = require('./config.js');

const t = {
  name: 'Network',
  version: '1.0',
};

function addOrg(t, org) {
  if(!t.organizations) {
    t.organizations = {};
  }
  t.organizations[org] = {
    // mspid: `${org}MSP`,
    mspid: `${org}`,
    peers: [
      `peer0.${org}.${cfg.domain}:7051`
    ]
  };

    if (org === cfg.org) {
        const certDomain = `${(cfg.isOrderer ? "" : org + ".") + cfg.domain}`;
        const mspPath = `${cfg.isOrderer ? cfg.ORDERER_CRYPTO_DIR : cfg.PEER_CRYPTO_DIR}/users/Admin@${certDomain}/msp`;
        const keystorePath = `${mspPath}/keystore`;
        const keystoreFiles = fs.readdirSync(keystorePath);
        const keyPath = `${keystorePath}/${keystoreFiles[0]}`;

        t.organizations[org].certificateAuthorities = [org];
        t.organizations[org].adminPrivateKey = {
            path: keyPath
        };
        t.organizations[org].signedCert = {
            path: `${mspPath}/signcerts/Admin@${certDomain}-cert.pem`
        };
    }
}

function addPeer(t, org, i, peerAddress) {
  if(!t.peers) {
    t.peers = {};
  }
    const peerName = `peer${i}.${org}.${cfg.domain}:7051`;
    t.peers[peerName] = {
    url: `grpcs://${peerAddress}`,
    grpcOptions: {
       'ssl-target-name-override': `peer${i}.${org}.${cfg.domain}`,
      //'ssl-target-name-override': 'localhost',
    },
    tlsCACerts: {
      path: `${cfg.PEER_CRYPTO_DIR}/peers/peer${i}.${org}.${cfg.domain}/msp/tlscacerts/tlsca.${org}.${cfg.domain}-cert.pem`
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
      path: `${cfg.PEER_CRYPTO_DIR}/ca/ca.${org}.${cfg.domain}-cert.pem`
    },
    registrar: [
      {
        enrollId: cfg.enrollId,
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

module.exports = function () {
  t.client = {
    organization: cfg.org,
    credentialStore: {
      path: `hfc-kvs/${cfg.org}`,
      cryptoStore: {
        path: `hfc-cvs/${cfg.org}`
      }
    },
    connection: {
      options: {
        // @formatter:off
        ...envOptionToSetting('GRPC_MAX_RECEIVE_MESSAGE_LENGTH', 'grpc.max_receive_message_length'),  //-1
        ...envOptionToSetting('GRPC_MAX_SEND_MESSAGE_LENGTH','grpc.max_send_message_length'),         //-1
        ...{'grpc.max_pings_without_data': 0, 'grpc.http2.max_pings_without_data': 0}, //until defaults are updated in fabric-sdk
        ...envOptionToSetting('GRPC_MAX_PINGS_WITHOUT_DATA','grpc.max_pings_without_data'),                 ...envOptionToSetting('GRPC_MAX_PINGS_WITHOUT_DATA','grpc.http2.max_pings_without_data'),  //0
        ...envOptionToSetting('GRPC_KEEP_ALIVE_MS','grpc.keepalive_time_ms'),                               ...envOptionToSetting('GRPC_KEEP_ALIVE_MS','grpc.http2.keepalive_time', 1000),                   //120000
        ...envOptionToSetting('GRPC_KEEP_ALIVE_TIMEOUT_MS','grpc.keepalive_timeout_ms'),                    ...envOptionToSetting('GRPC_KEEP_ALIVE_TIMEOUT_MS','grpc.http2.keepalive_timeout', 1000),        //120000
        ...envOptionToSetting('GRPC_KEEP_ALIVE_PERMIT_WITHOUT_CALLS','grpc.keepalive_permit_without_calls'), ...envOptionToSetting('GRPC_KEEP_ALIVE_PERMIT_WITHOUT_CALLS','grpc.http2.keepalive_permit_without_calls'), //1

        //set default for 'min_time_between_pings_ms' then set it to the keep alive time, and override if it's set itself (until defaults are updated in fabric-sdk):
        ...{'grpc.min_time_between_pings_ms':60000, 'grpc.http2.min_time_between_pings_ms': 60000},
        ...envOptionToSetting('GRPC_KEEP_ALIVE_MS','grpc.min_time_between_pings_ms', 1.1),              ...envOptionToSetting('GRPC_KEEP_ALIVE_MS','grpc.http2.min_time_between_pings_ms', 1.1),
        ...envOptionToSetting('GRPC_MIN_TIME_BETWEEN_PINGS_MS','grpc.min_time_between_pings_ms'),  ...envOptionToSetting('GRPC_MIN_TIME_BETWEEN_PINGS_MS','grpc.http2.min_time_between_pings_ms')
        // @formatter:on
      }
    }
  };

  try {
    orgs = JSON.parse(cfg.orgs);
  } catch(e) {
    orgs = JSON.parse('{' + cfg.orgs + '}');
  }

  try {
    cas = JSON.parse(cfg.cas);
  } catch(e) {
    cas = JSON.parse('{' + cfg.cas + '}');
  }

  Object.keys(orgs).forEach(k => {
    addOrg(t, k);
    if (!cfg.isOrderer) {
        addPeer(t, k, 0, orgs[k]);
    }
  });

    if (cfg.isOrderer) {
      addOrg(t, cfg.ordererName)
    }

  Object.keys(cas).forEach(k => {
    addCA(t, k, cas[k]);
  });

  return t;
};
