# fabric-starter-rest
REST API server and client for Hyperledger Fabric built with NodeJS SDK.

See usage examples at 
[fabric-starter](https://github.com/olegabu/fabric-starter#use-rest-api-to-query-and-invoke-chaincodes).

Test.
```bash
npm test
```
Develop: run REST server with `nodemon` to reload on changes.
```bash
npm run dev
```
Serve. Run REST server.
```bash
npm start
```
Build docker image.
```bash
docker build -t olegabu/fabric-starter-rest .

docker push olegabu/fabric-starter-rest
```
