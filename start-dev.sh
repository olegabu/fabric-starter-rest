#!/usr/bin/env bash

export PORT=${PORT:-4000}
export PATH=./bin:$PATH
export ORG=${ORG:-org1}
export DOMAIN=${DOMAIN:-example.com}
export CRYPTO_CONFIG_DIR=${CRYPTO_CONFIG_DIR:-../fabric-starter/crypto-config}
[ ! -d "$CRYPTO_CONFIG_DIR" ] && echo "CRYPTO_CONFIG_DIR not found" && exit 1

export MSP_DIR=${CRYPTO_CONFIG_DIR}/peerOrganizations/${ORG:-org1}.${DOMAIN:-example.com}/msp

export CORE_PEER_LOCALMSPID=${ORG:-org1}
export CORE_PEER_MSPCONFIGPATH=${CRYPTO_CONFIG_DIR}/peerOrganizations/${ORG:-org1}.${DOMAIN:-example.com}/users/Admin@o${ORG:-org1}.${DOMAIN:-example.com}/msp
export CORE_PEER_ADDRESS=peer0.${ORG:-org1}.${DOMAIN:-example.com}:7051

export DISCOVER_AS_LOCALHOST=true

rm -rf hfc-*

echo -e "\n\n\n"
echo "Using PORT: $PORT"
echo "ORG: $ORG"
echo "DOMAIN: $DOMAIN"
echo "DISCOVER_AS_LOCALHOST: $DISCOVER_AS_LOCALHOST"
echo "Web ADMIN app folder: ${WEBADMIN_DIR:?Set WEBADMIN_DIR envvar to the admin application folder: export WEBADMIN_DIR=../fabric-starter-admin-web}"
echo -e  "\n\n\n"

npx nodemon app.js