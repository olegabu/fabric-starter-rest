ARG DOCKER_REGISTRY
ARG FABRIC_STARTER_VERSION
FROM ${DOCKER_REGISTRY:-docker.io}/olegabu/fabric-tools-extended:${FABRIC_STARTER_VERSION:-latest}

MAINTAINER olegabu

# Create app directory
WORKDIR /usr/src/app

## install dependencies
COPY gost-deps ./gost-deps
COPY "package.json" .

RUN apt-get update && apt-get install -y python make dumb-init \
&& npm install && npm rebuild && npm cache rm --force \
&& apt-get remove -y python make && apt-get purge

############# TEST Consul Agent ############
RUN apt-get install -y make \
    && git clone https://github.com/ncopa/su-exec \
    && cd su-exec && make all \
    && cp su-exec /usr/local/bin \
    && cp /bin/bash /bin/sh \
    && apt-get remove -y make && apt-get purge
COPY --from=consul:latest /consul /consul
COPY --from=consul:latest /bin/consul /bin/consul
COPY --from=consul:latest /usr/local/bin/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN addgroup consul && \
    useradd -g consul consul \
    && chown -R consul:consul /consul \
    && test -e /etc/nsswitch.conf || echo 'hosts: files dns' > /etc/nsswitch.conf

VOLUME /consul/data
EXPOSE 8300
EXPOSE 8301 8301/udp 8302 8302/udp
EXPOSE 8500 8600 8600/udp
###############################################

RUN git clone https://github.com/olegabu/fabric-starter-admin-web.git --branch stable --depth 1 admin && npm install aurelia-cli -g && cd admin && npm install;  au build --env prod
#!-- remove:
#COPY fabric-starter-admin-web/ admin
#RUN cd admin && npm install && au build --env prod

# add project files (see .dockerignore for a list of excluded files)
COPY . .

EXPOSE 3000
CMD [ "npm", "start" ]

#  command for docker-compose.yaml: sh -c "sh -c '/usr/local/bin/docker-entrypoint.sh agent -dev -client 0.0.0.0 &' && npm start"

