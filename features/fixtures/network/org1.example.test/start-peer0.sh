#!/usr/bin/env bash

main() {
    docker rm -f -v $(docker ps -aq)
    docker volume rm ordererexampletest_orderer peer0org1exampletest_ledger peer0org1exampletest_admin_app peer0org1exampletest_admin_app

    sleep 1
    truncate --size 0 peer0.org1.example.test/crypto-config/hosts
    truncate --size 0 peer2.org1.example.test/crypto-config/hosts

    pushd peer0.*

    gitCleanDir ledger
    gitCleanDir crypto-config

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
}

function gitCleanDir() {
    local dir=${1:?Dir name is required}
    sudo chown -R $USER "$dir"
    git clean -xf "$dir"
    git checkout "$dir"
}

main
