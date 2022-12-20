#!/usr/bin/env bash

# use one time for new Hyperledger Fabric release
# first build fabric-tools-extended image then use this ./build-base.sh for building base image,
# and then ./build.sh for building final fabric-starter-rest image

FABRIC_STARTER_VERSION=${1:-${FABRIC_STARTER_VERSION:-hlf-2.3-snapshot-0.14}}
FABRIC_STARTER_REPOSITORY=${2:-${FABRIC_STARTER_REPOSITORY:-olegabu}}
DOCKER_REGISTRY=${3:-docker.io}

pushd ..
docker build -t ${DOCKER_REGISTRY}/${FABRIC_STARTER_REPOSITORY}/fabric-starter-rest:${FABRIC_STARTER_VERSION}-base  \
  --build-arg="DOCKER_REGISTRY=${DOCKER_REGISTRY}" --build-arg="FABRIC_STARTER_VERSION=${FABRIC_STARTER_VERSION}" \
  --build-arg="FABRIC_STARTER_REPOSITORY=${FABRIC_STARTER_REPOSITORY}" \
  --no-cache \
  -f docker-images/pre-build.dockerfile .
popd