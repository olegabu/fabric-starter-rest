#!/usr/bin/env bash

appSrcPath=../../jar-webapp
pushd ${appSrcPath}
mvn package
popd
cp ${appSrcPath}/target/demo-jar-webapp-0.1-jar-with-dependencies.jar app/
rm demo-jar-app.*
#zip -r demo-jar-app.zip .
tar --exclude='build.sh' --exclude='demo-jar-app.*' -zcvf demo-jar-app.tgz .