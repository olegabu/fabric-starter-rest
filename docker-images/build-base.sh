
FABRIC_STARTER_VERSION=${1:-${FABRIC_STARTER_VERSION:-latest}}
FABRIC_STARTER_REPOSITORY=${2:-olegabu}
DOCKER_REGISTRY=${3:-docker.io}

pushd ..
docker build -t ${DOCKER_REGISTRY}/${FABRIC_STARTER_REPOSITORY}/fabric-starter-rest:${FABRIC_STARTER_VERSION}-base  \
  --build-arg="DOCKER_REGISTRY=${DOCKER_REGISTRY}" --build-arg="FABRIC_STARTER_VERSION=${FABRIC_STARTER_VERSION}" \
  -f docker-images/pre-build.dockerfile .
popd