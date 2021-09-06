#!/usr/bin/env bash

pushd peer0.*

sudo chown -R $USER ledger
# git clean -xf ledger
# git checkout ledger

pushd ledger/orderer/etcdraft/wal/common
unzip 0000000000000000-0000000000000000.zip
popd

pushd ledger/orderer/etcdraft/wal/orderer-system-channel
unzip 0000000000000000-0000000000000000.zip
popd

docker network recreate fabric-starter_test --subnet 172.172.0.0/16

docker-compose up -d --force-recreate

popd



