ARG DOCKER_REGISTRY
ARG FABRIC_STARTER_VERSION
ARG CUSTOM_SOURCES_TAR
FROM ${DOCKER_REGISTRY:-docker.io}/olegabu/fabric-starter-rest:${FABRIC_STARTER_VERSION:-latest}


WORKDIR /usr/src/app

RUN mv admin/ webapps/admin-old

ADD ${CUSTOM_SOURCES_TAR:-custom-sources.tgz} /custom-admin

RUN cd /custom-admin && npm install \
&& PUBLIC_URL=/admin npm run build --mode=production \
&& npm cache clean -f

RUN cd /custom-admin && cp -r build /usr/src/app/admin && rm -rf /custom-admin;

EXPOSE 3000
CMD [ "npm", "start" ]
