#!/usr/bin/env bash

docker rm -f -v $(docker ps -aq)
docker volume rm ordererexampletest_orderer peer0org1exampletest_ledger peer0org1exampletest_admin_app peer0org1exampletest_admin_app

sleep 1
pushd peer0.*

sudo chown -R $USER ledger
git clean -xf ledger
git checkout ledger

pushd ledger/orderer/etcdraft/wal/common
unzip 0000000000000000-0000000000000000.zip
popd

pushd ledger/orderer/etcdraft/wal/orderer-system-channel
unzip 0000000000000000-0000000000000000.zip
popd

set -x
docker network rm fabric-starter_test
docker network create fabric-starter_test --subnet 172.172.0.0/16
set +x

docker-compose up -d --force-recreate

popd



