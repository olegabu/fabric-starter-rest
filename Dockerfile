FROM olegabu/fabric-tools-extended

MAINTAINER olegabu

# Create app directory
WORKDIR /usr/src/app

## install dependencies
# COPY ["package.json", "package-lock.json"] .
#COPY "package.json" .

RUN apt-get update
#&& apt-get install python make  \
#&& npm install && npm cache rm --force \
#&& apt-get remove -y python make && apt-get purge

# add project files (see .dockerignore for a list of excluded files)
#COPY . .

EXPOSE 3000
#CMD [ "npm", "start" ]
