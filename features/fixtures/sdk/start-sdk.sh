#!/usr/bin/env bash

fabricVersionFamily=${1:?Version family is required: 1x or 2x}
export ORG=${2:-org1}
export DOMAIN=${3:-example.test}
export PEER0_PORT=${4:-17051}

main() {
   local peerSubPath="${ORG}.${DOMAIN}/peer0.${ORG}.${DOMAIN}"

   export FABRIC_STARTER_HOME="../network/fabric-${fabricVersionFamily}/${peerSubPath}"

   docker-compose up -d --force-recreate
   docker logs sdk.${ORG}.${DOMAIN}
}

main
