#!/usr/bin/env bash

orgDefinitionPath=${1:?Path to org definition folder is required}

main() {
    pushd "${orgDefinitionPath}"
        pushd peer2.*
            gitCleanDir crypto-config
        popd

        pushd peer0.*
            gitCleanDir ledger
            gitCleanDir crypto-config

            pushd "ledger/orderer/etcdraft/wal/common"
                unzip 0000000000000000-0000000000000000.zip
            popd

            pushd "ledger/orderer/etcdraft/wal/orderer-system-channel"
                unzip 0000000000000000-0000000000000000.zip
            popd
        popd
    popd
}

function gitCleanDir() {
    local dir=${1:?Dir name is required}
    echo "Git clean PWD: $PWD"
    sudo chown -R $USER "$dir"
    git clean -xf "$dir"
    git checkout "$dir"
}

main
