# fabric-starter-rest
REST API server and client for Hyperledger Fabric built with NodeJS SDK.

See usage examples at 
[fabric-starter](https://github.com/olegabu/fabric-starter#use-rest-api-to-query-and-invoke-chaincodes).

To run test in development mode (from a developer's machine and not within container)
Set environment:
```bash
export ORG=org1 DOMAIN=example.com
```

Start fabric-starter orderer and peer with ports mapped to the host machine so the SDK clients can access them.
```bash
docker-compose -f docker-compose-orderer.yaml -f orderer-ports.yaml up

docker-compose -f docker-compose.yaml -f ports.yaml up
```
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
```
