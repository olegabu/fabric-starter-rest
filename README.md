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


# Connection options

Connection options can be specified in environment variables to control the _keep_alive_ policy:
(Note: Azure's load-balancer uses connection timeout set to 4 minutes. So _keep_alive_ should cover this.)

Environment variable | Default value used by Fabric SDK | Description
---------------------|----------------------------------|------------
GRPC_MAX_PINGS_WITHOUT_DATA| `2` | `2` - leads to an error of ping process. _fabric-starter-rest_ overrides this to `0` - means no limits
GRPC_KEEP_ALIVE_MS | 120000 (120 seconds)| Ping interval in milliseconds
GRPC_KEEP_ALIVE_TIMEOUT_MS|20000 (20 seconds) |Timeout period for the ping request itself
GRPC_KEEP_ALIVE_PERMIT_WITHOUT_CALLS|1|Allows pings with no payload
GRPC_MIN_TIME_BETWEEN_PINGS_MS| 300000 (5 minutes)|_Fabric-starter-rest_ resets this to 60 seconds to avoid disconnect of Azure Load Balancer (if GRPC_KEEP_ALIVE_TIMEOUT_MS is specified then the interval is set to GRPC_KEEP_ALIVE_TIMEOUT_MS/1.1)
