ARG DOCKER_REGISTRY
ARG FABRIC_STARTER_VERSION

FROM consul:latest AS consul

FROM ${DOCKER_REGISTRY:-docker.io}/olegabu/fabric-tools-extended:${FABRIC_STARTER_VERSION:-latest}

MAINTAINER olegabu

# Create app directory
WORKDIR /usr/src/app

## install dependencies
# COPY ["package.json", "package-lock.json"] .
COPY gost-deps ./gost-deps
COPY "package.json" .

#RUN apt-get update && apt-get install -y python make dumb-init \
#&& npm install && npm rebuild && npm cache rm --force \
#&& apt-get remove -y python make && apt-get purge
#
#COPY fabric-starter-admin-web/ admin
#RUN npm install aurelia-cli -g
#RUN cd admin && npm install
#
#RUN addgroup consul && \
#    useradd -g consul consul
#COPY --from=consul /consul /consul
#COPY --from=consul /bin/consul /bin/consul
#COPY --from=consul /usr/local/bin/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
#RUN echo 'su $1 -c \"$@\"' >> /usr/local/bin/su-exec && chmod +x /usr/local/bin/su-exec
#RUN test -e /etc/nsswitch.conf || echo 'hosts: files dns' > /etc/nsswitch.conf
#VOLUME /consul/data
#EXPOSE 8300
#EXPOSE 8301 8301/udp 8302 8302/udp
#EXPOSE 8500 8600 8600/udp


#RUN git clone https://github.com/olegabu/fabric-starter-admin-web.git --branch stable --depth 1 admin && npm install aurelia-cli -g && cd admin && npm install

RUN cd admin && npm install && au build --env prod

# add project files (see .dockerignore for a list of excluded files)
COPY . .

EXPOSE 3000
CMD [ "npm", "start" ]


#    command: sh -c "sh -c '/usr/local/bin/docker-entrypoint.sh agent -dev -client 0.0.0.0 &' && npm start"
