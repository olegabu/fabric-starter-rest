ARG DOCKER_REGISTRY
ARG FABRIC_STARTER_VERSION
ARG FABRIC_STARTER_REPOSITORY

FROM ${DOCKER_REGISTRY:-docker.io}/${FABRIC_STARTER_REPOSITORY:-olegabu}/fabric-tools-extended:${FABRIC_STARTER_VERSION:-latest}

MAINTAINER ${FABRIC_STARTER_REPOSITORY:-olegabu}

# Create app directory
WORKDIR /usr/src/app

## install dependencies
# COPY ["package.json", "package-lock.json"] .
COPY gost-deps ./gost-deps
COPY "package.json" .

RUN apt-get update && apt-get install python make  \
&& npm install && npm rebuild && npm cache rm --force \
&& apt-get remove -y python make && apt-get purge


RUN git clone https://github.com/olegabu/fabric-starter-admin-web.git --branch stable --depth 1 admin && npm install aurelia-cli@0.35.1 -g \
&& cd admin && npm install && au build --env prod && rm -rf node_modules

# add project files (see .dockerignore for a list of excluded files)
COPY . .

EXPOSE 3000
CMD [ "npm", "start" ]
