ARG DOCKER_REGISTRY
ARG FABRIC_STARTER_VERSION
ARG FABRIC_STARTER_REPOSITORY

FROM ${DOCKER_REGISTRY:-docker.io}/${FABRIC_STARTER_REPOSITORY:-olegabu}/fabric-tools-extended:${FABRIC_STARTER_VERSION:-latest}

MAINTAINER olegabu

# Create app directory
WORKDIR /usr/src/app

RUN apt-get remove docker docker-engine docker.io containerd runc || true
RUN apt-get update && apt-get install -y python make \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg-agent \
    software-properties-common

# docker
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
RUN add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"

RUN  apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io

# docker-compose
RUN sudo curl -L "https://github.com/docker/compose/releases/download/1.28.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose \
    && chmod +x /usr/local/bin/docker-compose

# default admin webapp
#RUN git clone https://github.com/olegabu/fabric-starter-admin-web.git --branch stable --depth 1 admin && npm install aurelia-cli@0.35.1 -g \
#&& cd admin && npm install && au build --env prod && rm -rf node_modules

# pre-install node modules
COPY "package.json" .
COPY "package-lock.json" .

RUN npm install && npm rebuild

CMD [ "bash" ]