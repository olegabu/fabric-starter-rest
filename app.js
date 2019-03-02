const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const logger = require('log4js').getLogger('app');
const jsonwebtoken = require('jsonwebtoken');
const jwt = require('express-jwt');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const os = require('os');
const _ = require('lodash');
const cfg = require('./config.js');
const expressSwagger = require('express-swagger-generator')(app);
const storage = os.tmpdir() || './upload';
const upload = multer({dest: storage});
let cpUpload = upload.fields([{name: 'file', maxCount: 1}, {
  name: 'channelId',
  maxCount: 1
}, {name: 'targets'}, {name: 'version', maxCount: 1}, {name: 'language', maxCount: 1}]);
const FabricStarterClient = require('./fabric-starter-client');
let fabricStarterClient = new FabricStarterClient();
const Socket = require('./rest-socket-server');

// parse json payload and urlencoded params in GET
app.use(bodyParser.json({limit: '100MB', type: 'application/json'}));
app.use(bodyParser.urlencoded({extended: true, limit: '100MB'}));

// allow CORS from all urls
app.use(cors());
app.options('*', cors());

// serve web app as static
const webappDir = process.env.WEBAPP_DIR || './webapp';
app.use('/webapp', express.static(webappDir));
logger.info('serving webapp at /webapp from ' + webappDir);

// serve msp directory with certificates as static
const mspDir = process.env.MSP_DIR || './msp';
const serveIndex = require('serve-index');
//TODO serveIndex should show directory listing to find certs but not working
app.use('/msp', express.static(mspDir), serveIndex('/msp', {'icons': true}));
logger.info('serving certificates at /msp from ' + mspDir);

// serve favicon
const favicon = require('serve-favicon');
app.use(favicon(path.join(webappDir, 'favicon.ico')));

// catch promise rejections and return 500 errors
const asyncMiddleware = fn =>
  (req, res, next) => {
    // logger.debug('asyncMiddleware');
    Promise.resolve(fn(req, res, next))
      .catch(e => {
        logger.error('asyncMiddleware', e);
        res.status(500).json(e && e.message);
        next();
      });
  };

// require presence of JWT in Authorization Bearer header
const jwtSecret = fabricStarterClient.getSecret();
app.use(jwt({secret: jwtSecret}).unless({path: ['/', '/users', '/mspid', '/config', new RegExp('/api-docs'), '/api-docs.json', /\/consortium/]}));

// use fabricStarterClient for every logged in user
const mapFabricStarterClient = {};

app.use(async(req, res, next) => {
  if(req.user) {
    const login = req.user.sub;

    let client = mapFabricStarterClient[login];
    if(client) {
      logger.debug('cached client for', login);
      req.fabricStarterClient = client;
    } else {
      logger.debug('new client for', login); //TODO: should not be reachable
      req.fabricStarterClient = new FabricStarterClient();
      await req.fabricStarterClient.init();
      try {
        await req.fabricStarterClient.loginOrRegister(login);
      } catch(e) {
        logger.error('loginOrRegister', e);
        res.status(500).json(e && e.message);
      }

      mapFabricStarterClient[login] = req.fabricStarterClient;
    }
  }
  next();
});

const appRouter = (app) => {

  app.get('/', (req, res) => {
    res.status(200).send('Welcome to fabric-starter REST server');
  });

  /**
   * Show MSPID of the organization to aid the web app
   * @route GET /mspid
   * @group config - Queries for config
   * @returns {string} 200 - MSPID
   * @returns {Error}  default - Unexpected error
   */
  app.get('/mspid', (req, res) => {
    res.json(fabricStarterClient.getMspid());
  });

  //TODO use for development only as it may expose sensitive data
  /**
   * Network config json to aid debugging; use for development only as it may expose sensitive data
   * @route GET /config
   * @group config - Queries for config
   * @returns {object} 200 - Network config
   * @returns {Error}  default - Unexpected error
   */
  app.get('/config', (req, res) => {
    res.json(fabricStarterClient.getNetworkConfig());
  });

  /**
   * Query chaincodes installed on the first peer of my organization
   * @route GET /chaincodes
   * @group chaincodes - Queries and operations on chaincode
   * @returns {object} 200 - Array of chaincode names
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.get('/chaincodes', asyncMiddleware(async(req, res, next) => {
    res.json(await req.fabricStarterClient.queryInstalledChaincodes());
  }));

  app.post('/chaincodes', cpUpload, asyncMiddleware(async(req, res, next) => {
    res.json(await req.fabricStarterClient.installChaincode(req.body.channelId,
      req.files['file'][0].originalname.substring(0, req.files['file'][0].originalname.length - 4),
      req.files['file'][0].path, req.body.version, req.body.language, req.body.targets.split(','), storage));
  }));

  /**
   * @typedef User
   * @property {string} username.required - username - eg: oleg
   * @property {string} password.required - password - eg: pass
   */

  /**
   * Login or register user.
   * @route POST /users
   * @group users - Authentication and operations about users
   * @param {User.model} user.body.required
   * @returns {object} 200 - User logged in and his JWT returned
   * @returns {Error}  default - Unexpected error
   */
  app.post('/users', asyncMiddleware(async(req, res, next) => {
    if(!mapFabricStarterClient[req.body.username]) {
      mapFabricStarterClient[req.body.username] = new FabricStarterClient();
    }
    req.fabricStarterClient = mapFabricStarterClient[req.body.username];
    await req.fabricStarterClient.init();
    await req.fabricStarterClient.loginOrRegister(req.body.username, req.body.password || req.body.username);

    const token = jsonwebtoken.sign({sub: req.fabricStarterClient.user.getName()}, jwtSecret);
    logger.debug('token', token);
    res.json(token);
  }));

  /**
   * Query channels joined by the first peer of my organization
   * @route GET /channels
   * @group channels - Queries and operations on channels
   * @returns {object} 200 - Array of channel names
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.get('/channels', asyncMiddleware(async(req, res, next) => {
    res.json(await req.fabricStarterClient.queryChannels());
  }));

  app.post('/channels', asyncMiddleware(async(req, res, next) => {
    await req.fabricStarterClient.createChannel(req.body.channelId);
    res.json(await joinChannel(req.body.channelId, req.fabricStarterClient));
  }));

  async function joinChannel(channelId, fabricStarterClient) {
    try {
      const ret = await fabricStarterClient.joinChannel(channelId);
      socket.retryJoin(cfg.JOIN_RETRY_COUNT, async function() {
        await socket.updateServer(channelId);
      });
      return ret;
    } catch(error) {
      logger.error(error.message);
      throw new Error(error.message);
    }
  }

  /**
   * Query channel info
   * @route GET /channels/{channelId}
   * @group channels - Queries and operations on channels
   * @param {string} channelId.path.required - channel - eg: common
   * @returns {object} 200 - Channel info
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.get('/channels/:channelId', asyncMiddleware(async(req, res, next) => {
    res.json(await req.fabricStarterClient.queryInfo(req.params.channelId));
  }));

  /**
   * Query organizations in a channel
   * @route GET /channels/{channelId}/orgs
   * @group channels - Queries and operations on channels
   * @param {string} channelId.path.required - channel - eg: common
   * @returns {object} 200 - Array of MSPIDs
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.get('/channels/:channelId/orgs', asyncMiddleware(async(req, res, next) => {
    res.json(await req.fabricStarterClient.getOrganizations(req.params.channelId));
  }));

  /**
   * Query peers that joined a channel
   * @route GET /channels/{channelId}/peers
   * @group channels - Queries and operations on channels
   * @param {string} channelId.path.required - channel - eg: common
   * @returns {object} 200 - Array of peer names
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.get('/channels/:channelId/peers', asyncMiddleware(async(req, res, next) => {
    res.json(await req.fabricStarterClient.getPeersForOrgOnChannel(req.params.channelId));
  }));

  /**
   * Query peers of an organization
   * @route GET /orgs/{org}/peers
   * @group orgs - Queries for organizations
   * @param {string} org.path.required - organization - eg: org1
   * @returns {object} 200 - Array of peer names
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.get('/orgs/:org/peers', asyncMiddleware(async(req, res, next) => {
    res.json(await req.fabricStarterClient.getPeersForOrg(req.params.org));
  }));

  app.post('/channels/:channelId/orgs', asyncMiddleware(async(req, res, next) => {
    res.json(req.fabricStarterClient.addOrgToChannel(req.params.channelId, req.body.orgId));
  }));

  app.post('/channels/:channelId', asyncMiddleware(async(req, res, next) => {
    res.json(await joinChannel(req.params.channelId, req.fabricStarterClient));
  }));

  /**
   * Query a given block in a channel
   * @route GET /channels/{channelId}/blocks/{number}
   * @group channels - Queries and operations on channels
   * @param {string} channelId.path.required - channel - eg: common
   * @param {integer} number.path.required - block number - eg: 1
   * @returns {object} 200 - Block
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.get('/channels/:channelId/blocks/:number', asyncMiddleware(async(req, res, next) => {
    res.json(await req.fabricStarterClient.queryBlock(req.params.channelId, parseInt(req.params.number)));
  }));

  /**
   * Query a given transaction in a channel
   * @route GET /channels/{channelId}/transactions/{id}
   * @group channels - Queries and operations on channels
   * @param {string} channelId.path.required - channel - eg: common
   * @param {string} id.path.required - transaction id - eg: 5e4c57948cf6fe4650c28999c389c897ee9039c078b0d20ed72d0126f0046540
   * @returns {object} 200 - Transaction
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.get('/channels/:channelId/transactions/:id', asyncMiddleware(async(req, res, next) => {
    res.json(await req.fabricStarterClient.queryTransaction(req.params.channelId, req.params.id));
  }));

  /**
   * Query chaincodes instantiated on a channel
   * @route GET /channels/{channelId}/chaincodes
   * @group channels - Queries and operations on channels
   * @param {string} channelId.path.required - channel - eg: common
   * @returns {object} 200 - Array of chaincodes
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.get('/channels/:channelId/chaincodes', asyncMiddleware(async(req, res, next) => {
    res.json(await req.fabricStarterClient.queryInstantiatedChaincodes(req.params.channelId));
  }));

  app.post('/channels/:channelId/chaincodes', asyncMiddleware(async(req, res, next) => {
    res.json(await req.fabricStarterClient.instantiateChaincode(req.params.channelId, req.body.chaincodeId,
      req.body.chaincodeType, req.body.fcn, req.body.args, req.body.chaincodeVersion, req.body.targets));
  }));

  /**
   * Query chaincode
   * @route GET /channels/{channelId}/chaincodes/{chaincodeId}
   * @group chaincode - Invoke and query chaincode
   * @param {string} channelId.path.required - channel - eg: common
   * @param {string} chaincodeId.path.required - channel - eg: reference
   * @param {string} fcn.query.required - chaincode function name - eg: list
   * @param {string} args.query.required - string encoded arguments to chaincode function - eg: ["account"]
   * @param {string} targets.query - list of peers to query - eg: ["peer0.org1.example.com:7051"]
   * @param {boolean} unescape.query - return not array of strings but array of json objects - eg. true
   * @returns {object} 200 - An array of query results
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.get('/channels/:channelId/chaincodes/:chaincodeId', asyncMiddleware(async(req, res, next) => {
    let ret = await req.fabricStarterClient.query(req.params.channelId, req.params.chaincodeId,
      req.query.fcn, req.query.args, extractTargets(req, "query"));

    if(ret[0].startsWith('Error')) {
      throw new Error(ret[0]);
    }

    if(req.query.unescape) {
      ret = ret.map(o => {
        let u = o;

        try {
          u = JSON.parse(o);
        } catch(e) {
          logger.debug('cannot JSON.parse', e);
        }

        return u;
      });
    }

    res.json(ret);
  }));

  /**
   * @typedef Invoke
   * @property {string} fcn.required - chaincode function name - eg: put
   * @property {Array.<string>} args.required - string encoded arguments to chaincode function - eg: ["account","1","{name:\"one\"}"]
   * @property {boolean} waitForTransactionEvent - respond only when transaction commits - eg: true
   */

  /**
   * Invoke chaincode
   * @route POST /channels/{channelId}/chaincodes/{chaincodeId}
   * @group chaincode - Invoke and query chaincode
   * @param {string} channelId.path.required - channel - eg: common
   * @param {string} chaincodeId.path.required - channel - eg: reference
   * @param {Invoke.model} invoke.body.required - invoke request
   * @returns {object} 200 - Transaction id
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.post('/channels/:channelId/chaincodes/:chaincodeId', asyncMiddleware(async(req, res, next) => {
    let result = await req.fabricStarterClient.invoke(req.params.channelId, req.params.chaincodeId,
      req.body.fcn, req.body.args, extractTargets(req, "body"), req.body.waitForTransactionEvent);
    res.json(result);
  }));

  /**
   * Query member organizations of current consortium
   * @route GET /consortium/members
   * @group orgs - Queries for organizations
   * @returns {object} 200 - Array of MSPIDs
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.get('/consortium/members', asyncMiddleware(async(req, res, next) => {
    res.json(await req.fabricStarterClient.getConsortiumMemberList());
  }));

};

function extractTargets(req, prop) {
  let result = {};
  let targets = _.get(req, `${prop}.targets`);

  try {
    targets = JSON.parse(targets);
  } catch(e) {
    logger.warn("Targets are not parseable", targets, e.message);
  }
  if(targets) result.targets = targets;

  if(!targets) {
    let peers = _.concat([], _.get(req, `${prop}.peer`) || _.get(req, `${prop}.peers`) || []);
    if(!_.isEmpty(peers)) {
      result.peers = _.map(peers, p => {
        let parts = _.split(p, "/"); //format: org/peer0
        let peerOrg = parts[0];
        let peerName = parts[1];
        return `${peerName}.${peerOrg}.${cfg.domain}:7051`;
      })
    }
  }

  return result;
}

appRouter(app);

const server = app.listen(process.env.PORT || 3000, function() {
  logger.info('started fabric-starter rest server on port', server.address().port);
});

const socket = new Socket(fabricStarterClient);

socket.startSocketServer(server).then(() => {
  logger.info('started socket server');
});

// see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#swagger-object
expressSwagger({
  swaggerDefinition: {
    info: {
      description: 'API server for Hyperledger Fabric',
      title: 'fabric-starter-rest',
      version: '1.0.0',
    },
    host: 'localhost:4000',
    // basePath: '/v1',
    basePath: '/',
    produces: [
      "application/json",
      // "application/xml"
    ],
    schemes: ['http'/*, 'https'*/],
    securityDefinitions: {
      JWT: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: "Paste the jwt you received from logging in by a post to /users ex.: Bearer eyJhbGci...",
      }
    }
  },
  basedir: __dirname, //app absolute path
  files: ['./app.js'] //Path to the API handle folder
});
