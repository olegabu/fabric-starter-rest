#!/usr/bin/env bash

networkDefinitionPath=${1:?Path to network definition folder is required}
org=${2:-org1}
domain=${3:-example.test}

main() {

    local orgSubPath="${org}.${domain}"
    local domainSanitized="${domain//./}"
    local orgSubPathSanitized="${orgSubPath//./}"

    docker rm -f -v $(docker ps -aq)
    docker volume rm peer0${orgSubPathSanitized}_ledger peer0${orgSubPathSanitized}_admin_app peer0${orgSubPathSanitized}_nginx_templates
    sleep 0.5

    ./renew-org-folder.sh "${networkDefinitionPath}/${orgSubPath}"

    set -x
    docker network rm fabric-starter_test
    docker network create fabric-starter_test --subnet 172.172.0.0/16
    set +x

    pushd "${networkDefinitionPath}/${orgSubPath}/peer0.${orgSubPath}"
        docker-compose up -d --force-recreate
    popd
}

main
