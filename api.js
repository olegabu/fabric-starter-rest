module.exports = function(app, server) {

  const fs = require("fs");
  const path = require('path');
  const os = require('os');
  const jsonwebtoken = require('jsonwebtoken');
  const jwt = require('express-jwt');
  const _ = require('lodash');
  const cfg = require('./config.js');
  const logger = cfg.log4js.getLogger('api');
  const util = require('./util');

  const channelManager = require('./channel-manager');
  const osnManager = require('./osn-manager');

  // upload for chaincode and app installation
  const uploadDir = os.tmpdir() || './upload';
  const multer = require('multer');
  const upload = multer({dest: uploadDir});
  const fileUpload = upload.fields([ {name: 'file', maxCount: 1}, { name: 'channelId', maxCount: 1},
    {name: 'targets'}, {name: 'version', maxCount: 1}, {name: 'language', maxCount: 1},{name: 'fcn', maxCount: 1},
    {name: 'args', maxCount: 1},{name: 'chaincodeType', maxCount: 1},{name: 'chaincodeId', maxCount: 1},
    {name: 'chaincodeVersion', maxCount: 1},{name: 'waitForTransactionEvent', maxCount: 1},{name: 'policy', maxCount: 1}]);

  // fabric client
  const FabricStarterClient = require('./fabric-starter-client');
  const fabricStarterClient = new FabricStarterClient();
  const webAppManager = require('./web-app-manager');

  // socket.io server to pass blocks to webapps
  const Socket = require('./rest-socket-server');
  const socket = new Socket(fabricStarterClient);
  socket.startSocketServer(server, cfg.UI_LISTEN_BLOCK_OPTS).then(() => {
    logger.info('started socket server');
  });

// parse json payload and urlencoded params
  const bodyParser = require("body-parser");
  app.use(bodyParser.json({limit: '100MB', type: 'application/json'}));
  app.use(bodyParser.urlencoded({extended: true, limit: '100MB'}));

// allow CORS from all urls
  const cors = require('cors');
  app.use(cors());
  app.options('*', cors());

// serve admin and custom web apps as static
  const express = require("express");
  const webappDir = process.env.WEBAPP_DIR || './webapp';
  app.use('/webapp', express.static(webappDir));
  logger.info(`serving webapp at /webapp from ${webappDir}`);
  app.use('/admin', express.static(cfg.WEBADMIN_DIR));
  app.use('/admin/*', express.static(cfg.WEBADMIN_DIR));
  logger.info(`serving admin at /admin from ${cfg.WEBADMIN_DIR}`);

// serve msp directory with certificates as static
  const mspDir = process.env.MSP_DIR || './msp';
  const serveIndex = require('serve-index');
//TODO serveIndex should show directory listing to find certs but not working
  app.use('/msp', express.static(mspDir), serveIndex('/msp', {'icons': true}));
  logger.info('serving certificates at /msp from ' + mspDir);

// serve favicon
  const favicon = require('serve-favicon');
  if(fs.existsSync(path.join(webappDir, 'favicon.ico'))) {
    app.use(favicon(path.join(webappDir, 'favicon.ico')));
  }

// catch promise rejections and return 500 errors
  const asyncMiddleware = fn =>
    (req, res, next) => {
      // logger.debug('asyncMiddleware');
      Promise.resolve(fn(req, res, next))
        .catch(e => {
          logger.error('asyncMiddleware', e);
          res.status((e && e.status) || 500).json(e && e.message);
          next();
        });
    };

// require presence of JWT in Authorization Bearer header
  const jwtSecret = fabricStarterClient.getSecret();
  app.use(jwt({secret: jwtSecret}).unless({path: ['/', '/users', '/domain', '/mspid', '/config', new RegExp('/api-docs'), '/api-docs.json', /\/webapp/, /\/webapps\/.*/,'/admin/', /\/admin\/.*/, '/msp/', /\/integration\/.*/]}));

// use fabricStarterClient for every logged in user
  const mapFabricStarterClient = {};

  app.use((req, res, next) => {
    if (req.user) {
      const login = req.user.sub;
      let client = mapFabricStarterClient[login];
      if (client) {
        logger.debug('cached client for', login);
        req.fabricStarterClient = client;
      } else {
        throw (new jwt.UnauthorizedError("No client context", {message: 'User is not logged in.'}));
      }
    }
    next();
  });

  app.get('/', (req, res) => {
    res.status(200).send('Welcome to fabric-starter REST server');
  });

  app.post('/cert', (req, res) => {
    res.json(fabricStarterClient.decodeCert(req.body.cert));
  });

  /**
   * Show network name (as defined by DOMAIN env variable at setup time)
   * @route GET /domain
   * @group config - Queries for config
   * @returns {string} 200 - DOMAIN
   * @returns {Error}  default - Unexpected error
   */
  app.get('/domain', (req, res) => {
    res.json(cfg.domain);
  });

  /**
   * Show name (MSPID) of my organization
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
   * @returns {object} 200 - Array of chaincode objects
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.get('/chaincodes', asyncMiddleware(async(req, res, next) => {
    res.json(await req.fabricStarterClient.queryInstalledChaincodes());
  }));

  /**
   * Install chaincode
   * @route POST /chaincodes
   * @group chaincodes - Queries and operations on chaincode
   * @param {string} channelId.formData.required - channel - eg: common
   * @param {file} file.formData.required - chaincode source code archived in zip - eg: chaincode_example02.zip
   * @param {string} targets.formData.required - list of peers to install to - eg: ["peer0.org1.example.com:7051"]
   * @param {string} version.formData (default 1.0) - chaincode version - eg: 1.0
   * @param {string} language.formData (default node) - chaincode language - eg: golang
   * @returns {object} 200 - Chaincode installed
   * @returns {Error}  default - Unexpected error
   * @security JWT
   * @consumes multipart/form-data
   */
  app.post('/chaincodes', fileUpload, asyncMiddleware(async(req, res, next) => {
    res.json(await req.fabricStarterClient.installChaincode(
      req.files['file'][0].originalname.substring(0, req.files['file'][0].originalname.length - 4),
      req.files['file'][0].path, req.body.version, req.body.language, uploadDir));
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
    // let namePasswordKey=`${req.body.username}.${req.body.password}`;
    // if(!mapFabricStarterClient[namePasswordKey]) {
    // }
    mapFabricStarterClient[req.body.username] && mapFabricStarterClient[req.body.username].logoutUser(req.body.username);
    mapFabricStarterClient[req.body.username]=new FabricStarterClient();
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
   * @returns {object} 200 - Array of channel objects
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.get('/channels', asyncMiddleware(async(req, res, next) => {
    res.json(await req.fabricStarterClient.queryChannels());
  }));

  /**
   * @typedef Channel
   * @property {string} channelId.required - channel name - eg: common
   */


  /**
   * Join channel
   * @route POST /channels/{channelId}
   * @group channels - Queries and operations on channels
   * @param {string} channelId.path.required - channel - eg: common
   * @returns {object} 200 - Channel joined
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.post('/channels/:channelId', asyncMiddleware(async (req, res, next) => {
    let ret = await channelManager.joinChannel(req.params.channelId, req.fabricStarterClient, socket);
    await socket.awaitForChannel(req.params.channelId);
    res.json(ret);
  }));


  /**
   * Create channel and join it
   * @route POST /channels
   * @group channels - Queries and operations on channels
   * @param {Channel.model} channel.body.required
   * @returns {object} 200 - Channel created
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.post('/channels', asyncMiddleware(async(req, res, next) => {
    await req.fabricStarterClient.createChannel(req.body.channelId);
    res.json(await channelManager.joinChannel(req.body.channelId, req.fabricStarterClient, socket));
  }));

  async function joinChannel(channelId, fabricStarterClient) {
    try {
      const ret = await fabricStarterClient.joinChannel(channelId);
      util.retryOperation(cfg.LISTENER_RETRY_COUNT, async function () {
        await socket.registerChannelChainblockListener(channelId);
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
   * @returns {object} 200 - Channel block info
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
   * @param {boolean} filter.path.required - reject orderer name flag
   * @returns {object} 200 - Array of organization objects with names (MSPIDs)
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.get('/channels/:channelId/orgs', asyncMiddleware(async(req, res, next) => {
    res.json(await req.fabricStarterClient.getOrganizations(req.params.channelId, req.query.filter));
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
   * @returns {object} 200 - Array of peer objects
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.get('/orgs/:org/peers', asyncMiddleware(async(req, res, next) => {
    res.json(await req.fabricStarterClient.getPeersForOrg(req.params.org || cfg.org));
  }));

  /**
   * @typedef Organization
   * @property {string} orgId.required - organization name by convention same as MSPID- eg: org1
   */

  /**
   * Add organization to a channel
   * @route POST /channels/{channelId}/orgs
   * @group channels - Queries and operations on channels
   * @param {string} channelId.path.required - channel - eg: common
   * @param {Organization.model} organization.body.required
   * @returns {object} 200 - Organization added
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.post('/channels/:channelId/orgs', asyncMiddleware(async(req, res, next) => {
    res.json(await req.fabricStarterClient.addOrgToChannel(req.params.channelId, orgFromHttpBody(req.body)));
  }));


  /**
   * Get all organizations registered in DNS service (currently matches with common channel orgs, but not necessary in future)
   * @route GET /network/orgs
   * @group orgs - Organizations registered in the blockchain network
   * @returns {object} 200 - Array of organization objects
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.get('/network/orgs', asyncMiddleware(async(req, res, next) => {
    let storedOrgs = await req.fabricStarterClient.query(cfg.DNS_CHANNEL, cfg.DNS_CHAINCODE, "get", '["orgs"]');
    let orgsArray =_.values(JSON.parse(_.get(storedOrgs,"[0]")));
    res.json(orgsArray);
  }));


  app.post('/service/accept/orgs', asyncMiddleware((req, res) => {
    logger.info('Orgs to service request: ', req.body);
    let orgMspIdsArray = _.isArray(req.body) ? req.body : [req.body];
    this.orgsToAccept = _.concat(this.orgsToAccept || [], orgMspIdsArray);
    res.json("OK")
  }));

  app.get('/service/accepted/orgs', asyncMiddleware((req, res) =>{
    res.json(this.orgsToAccept || []);
  }));

  app.post('/integration/service/orgs', asyncMiddleware(async (req, res) => {
    logger.info('Integration service request: ', req.body);
    let org = orgFromHttpBody(req.body);
    if (!this.orgsToAccept || _.find(this.orgsToAccept, o => o.orgId === org.orgId)) {
      let client = await createDefaultFabricClient();
      return res.json(await client.addOrgToChannel(cfg.DNS_CHANNEL, org));
    }
    res.status(301).json(`Org ${org.orgId} is not allowed`);
  }));

  app.post('/integration/service/raft', asyncMiddleware(async (req, res, next) => {
    logger.info('Raft integration service request: ', req.body);
    let orderer = ordererFromHttpBody(req.body);
    if (!this.orgsToAccept || _.find(this.orgsToAccept, o=>o.domain===orderer.domain)) {
      let client = await createDefaultFabricClient();
      return res.json(await osnManager.OsnManager.addRaftConsenter(orderer, client));
    }
    res.status(301).json(`Orderer domain ${orderer.domain} is not allowed`);
  }));

  async function createDefaultFabricClient() {
    let client = new FabricStarterClient();
    await client.init();
    await client.loginOrRegister(cfg.enrollId, cfg.enrollSecret);
    return client;
  }

  function orgFromHttpBody(body) {
    let org = {orgId: body.orgId, domain: body.domain, orgIp: body.orgIp, peer0Port: body.peerPort, wwwPort: body.wwwPort};
    logger.info('Org: ', org);

    return org;
  }

  function ordererFromHttpBody(body) {
    let orderer = {
      ordererName: body.ordererName, domain: body.domain, ordererPort: body.ordererPort,
      ordererIp: body.ordererIp, wwwPort: body.wwwPort
    };
    logger.info('Orderer: ', orderer);
    return orderer;
  }

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
   * @param {string} id.path.required - transaction id - eg: 5e4c57948cf6fe465...
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
   * @returns {object} 200 - Object with an array of chaincodes
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.get('/channels/:channelId/chaincodes', asyncMiddleware(async(req, res, next) => {
    res.json(await req.fabricStarterClient.queryInstantiatedChaincodes(req.params.channelId));
  }));

  /**
   * @typedef Instantiate
   * @property {string} chaincodeId.required - chaincode name - eg: reference
   * @property {string} fcn (default fcn) - chaincode function name - eg: init
   * @property {Array.<string>} args (default []) - string encoded arguments to chaincode function - eg: ["account","1","{name:\"one\"}"]
   * @property {string} chaincodeVersion - chaincode version (default 1.0) - eg: 1.0
   * @property {string} chaincodeType - chaincode language (default node) - eg: golang
   * @property {Array.<string>} targets - list of peers to send for endorsement - eg: ["peer0.org1.example.com:7051"]
   * @property {boolean} waitForTransactionEvent - respond only when transaction commits - eg: true
   */

  /**
   * Instantiate chaincode
   * @route POST /channels/{channelId}/chaincodes
   * @group channels - Queries and operations on channels
   * @param {string} channelId.path.required - channel - eg: common
   * @param {Instantiate.model} instantiate.body.required - instantiate request
   * @returns {object} 200 - Transaction id
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.post('/channels/:channelId/chaincodes', fileUpload, asyncMiddleware(async(req, res, next) => {
    if(req.files && req.files['file'])
      res.json(await req.fabricStarterClient.instantiateChaincode(req.params.channelId, req.body.chaincodeId,
        req.body.chaincodeType, req.body.fcn, extractArgs(req.body.args), req.body.chaincodeVersion, req.body.targets, req.body.waitForTransactionEvent, req.body.policy, req.files['file'][0].path));
    else
        res.json(await req.fabricStarterClient.instantiateChaincode(req.params.channelId, req.body.chaincodeId,
            req.body.chaincodeType, req.body.fcn, extractArgs(req.body.args), req.body.chaincodeVersion, req.body.targets, req.body.waitForTransactionEvent, req.body.policy));
  }));

    /**
     * Upgrade chaincode
     * @route POST /channels/{channelId}/chaincodes/upgrade
     * @group channels - Queries and operations on channels
     * @param {string} channelId.path.required - channel - eg: common
     * @param {upgrade.model} upgrade.body.required - upgrade request
     * @returns {object} 200 - Transaction id
     * @returns {Error}  default - Unexpected error
     * @security JWT
     */

  app.post('/channels/:channelId/chaincodes/upgrade', fileUpload, asyncMiddleware(async(req, res, next) => {
    if(req.files['file'])
       res.json(await req.fabricStarterClient.upgradeChaincode(req.params.channelId, req.body.chaincodeId,
          req.body.chaincodeType, req.body.fcn, extractArgs(req.body.args), req.body.chaincodeVersion, req.body.targets, req.body.waitForTransactionEvent, req.body.policy, req.files['file'][0].path));
    else
        res.json(await req.fabricStarterClient.upgradeChaincode(req.params.channelId, req.body.chaincodeId,
            req.body.chaincodeType, req.body.fcn, extractArgs(req.body.args), req.body.chaincodeVersion, req.body.targets, req.body.waitForTransactionEvent, req.body.policy));
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
   * @property {Array.<string>} targets - list of peers to send for endorsement - eg: ["peer0.org1.example.com:7051"]
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
      req.body.fcn, req.body.args, extractTargets(req, "body"), req.body.waitForTransactionEvent, req.body.transientMap);
    res.json(result);
  }));

  /**
   * Query member organizations of current consortium
   * @route GET /consortium/members
   * @group consortium - view and control participants
   * @returns {object} 200 - Array of MSPIDs
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.get('/consortium/members', asyncMiddleware(async(req, res, next) => {
    res.json(await req.fabricStarterClient.getConsortiumMemberList());
  }));

  /**
   * Add organization to the consortium
   * @route POST /consortium/members
   * @group consortium - view and control participants
   * @param {Organization.model} organization.body.required
   * @returns {object} 200 - Organization added
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.post('/consortium/members', asyncMiddleware(async(req, res, next) => {
    res.json(await req.fabricStarterClient.addOrgToConsortium(orgFromHttpBody(req.body)));
  }));

  /**
   * Get list of deployed custom web applications
   * @route GET /applications
   * @group applications - Web applications
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.get('/applications', fileUpload, asyncMiddleware(async(req, res, next) => {
    res.json(await webAppManager.getWebAppsList());
  }));

  /**
   * Deploy new web application
   * @route POST /applications
   * @group applications - Web applications
   * @param {file} file.formData.required - application compiled folder archived in zip - eg: coolwebapp.zip
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.post('/applications', fileUpload, asyncMiddleware(async (req, res, next) => {
      let fileUploadObj = _.get(req, "files.file[0]");
      const fileBaseName = path.basename(fileUploadObj.originalname, path.extname(fileUploadObj.originalname));
      res.json(await webAppManager.provisionWebAppFromPackage(fileUploadObj)
          .then(extractParentPath => {
              let appFolder=path.resolve(extractParentPath, fileBaseName);
              webAppManager.redeployWebapp(app, fileBaseName, appFolder);
              return webAppManager.getWebAppsList();
      }));
  }));


  /**
   * Get list of deployed custom middlewares
   * @route GET /middlewares
   * @group middlewares - Middlewares
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.get('/middlewares', fileUpload, asyncMiddleware(async(req, res, next) => {
      const list = await webAppManager.getMiddlewareList();
      res.json(list);
  }));

  /**
   * Deploy new middleware
   * @route POST /middlewares
   * @group middlewares - Web applications
   * @param {file} file.formData.required - middlewares's js file
   * @returns {Error}  default - Unexpected error
   * @security JWT
   */
  app.post('/middlewares', fileUpload, asyncMiddleware(async (req, res, next) => {
      let fileUploadObj = _.get(req, "files.file[0]");
      res.json(await webAppManager.provisionMiddleware(fileUploadObj)
          .then(extractParentPath => {
              const route = require(extractParentPath);
              route(app, asyncMiddleware);
              return webAppManager.getMiddlewareList();
      }));
  }));

  function extractArgs(args){
    let checkedArgs;
    if (args && _.isString(args))
       checkedArgs = JSON.parse(args);
    else if (args && _.isArray(args))
       checkedArgs = args;
    return checkedArgs;
  }


  function extractTargets(req, prop) {
    const result = {};
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
          const parts = _.split(p, "/"); //format: org/peer0
          const peerOrg = parts[0];
          const peerName = parts[1];
          return `${peerName}.${peerOrg}.${cfg.domain}:${cfg.DEFAULT_PEER0PORT}`;
        })
      }
    }

    return result;
  }

  const expressSwagger = require('express-swagger-generator')(app);
// see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#swagger-object
  expressSwagger({
    swaggerDefinition: {
      info: {
        description: 'API server for Hyperledger Fabric',
        title: 'fabric-starter-rest',
        version: `FABRIC_STARTER_REST_VERSION=${process.env.FABRIC_STARTER_REST_VERSION || 'latest'}`,
      },
      // host: 'localhost:4000',
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
    files: ['./api.js'] //Path to the API handle folder
  });

};
