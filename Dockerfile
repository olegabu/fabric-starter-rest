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

#install fixed fabric-sdk until pull-requests are merged into their release
RUN mkdir -p node_modules
RUN git clone https://github.com/LeonidLe/fabric-sdk-node/ -b release-1.4
RUN cp -r fabric-sdk-node/fabric-client node_modules
RUN rm -rf fabric-sdk-node

# add project files (see .dockerignore for a list of excluded files)
COPY . .

EXPOSE 3000
CMD [ "npm", "start" ]
