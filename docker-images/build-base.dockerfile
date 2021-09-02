ARG DOCKER_REGISTRY
ARG FABRIC_STARTER_VERSION
ARG FABRIC_STARTER_REPOSITORY

FROM ${DOCKER_REGISTRY:-docker.io}/${FABRIC_STARTER_REPOSITORY:-olegabu}/fabric-tools-extended:${FABRIC_STARTER_VERSION:-latest} as fabrictools

FROM node:8 as node_base

LABEL MAINTAINER=olegabu

# Create app directory
WORKDIR /usr/src/app

# default admin webapp
RUN git clone https://github.com/${FABRIC_STARTER_REPOSITORY:-olegabu}/fabric-starter-admin-web.git --branch stable --depth 1 admin && npm install aurelia-cli@0.35.1 -g \
&& cd admin && npm install && au build --env prod && rm -rf node_modulesconfigtxgen

# pre-install node modules
COPY "package.json" .
COPY gost-deps/crypto-gost/package.json ./gost-deps/crypto-gost/
COPY gost-deps/fabric-client/package.json ./gost-deps/fabric-client/
COPY gost-deps/fabric-cryptosuite-gost/package.json ./gost-deps/fabric-cryptosuite-gost/

RUN npm install && npm rebuild

# copy fabic executables if changed
COPY --from=fabrictools /usr/local/bin/configtxgen /usr/local/bin
COPY --from=fabrictools /usr/local/bin/configtxlator /usr/local/bin
COPY --from=fabrictools /usr/local/bin/peer /usr/local/bin


CMD [ "bash" ]