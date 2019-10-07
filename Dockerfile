FROM olegabu/fabric-tools-extended

MAINTAINER olegabu

# Create app directory
WORKDIR /usr/src/app

## install dependencies
# COPY ["package.json", "package-lock.json"] .
COPY "package.json" .

RUN apt-get update && apt-get install python make  \
&& npm install && npm cache rm --force \
&& apt-get remove -y python make && apt-get purge

RUN curl -L "https://github.com/docker/compose/releases/download/1.24.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose \
    && chmod +x /usr/local/bin/docker-compose

RUN git clone https://github.com/olegabu/fabric-starter-admin-web.git --branch orderer --depth 1 admin && npm install aurelia-cli -g && cd admin && npm install
RUN cd admin && au build --env prod

# add project files (see .dockerignore for a list of excluded files)
COPY . .

EXPOSE 3000
CMD [ "npm", "start" ]
