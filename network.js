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

module.exports = function () {
  t.client = {
    organization: cfg.org,
    credentialStore: {
      path: `hfc-kvs/${cfg.org}`,
      cryptoStore: {
        path: `hfc-cvs/${cfg.org}`
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
