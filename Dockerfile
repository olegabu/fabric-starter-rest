ARG DOCKER_REGISTRY
ARG FABRIC_STARTER_VERSION
FROM ${DOCKER_REGISTRY:-docker.io}/olegabu/fabric-starter-rest-prebuilt:${FABRIC_STARTER_VERSION:-latest}

LABEL MAINTAINER=olegabu

## install dependencies
COPY "package.json" .
COPY gost-deps/crypto-gost/package.json ./gost-deps/crypto-gost/
COPY gost-deps/fabric-client/package.json ./gost-deps/fabric-client/
COPY gost-deps/fabric-cryptosuite-gost/package.json ./gost-deps/fabric-cryptosuite-gost/

RUN npm install  && npm cache rm --force \
&& apt-get remove -y make python && apt-get purge
#&& npm rebuild

# add project files (see .dockerignore for a list of excluded files)
COPY . .

EXPOSE 3000
CMD [ "npm", "start" ]
