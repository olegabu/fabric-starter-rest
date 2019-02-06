const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cfg = require('./config.js');
const logger = require('log4js').getLogger('app');
const jsonwebtoken = require('jsonwebtoken');
const jwt = require('express-jwt');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const os = require('os');
const storage = os.tmpdir() || './upload';
const upload = multer({ dest: storage});
let cpUpload = upload.fields([{ name: 'file', maxCount: 1 }, { name: 'channelId', maxCount: 1 },{ name: 'targets'},{ name: 'version', maxCount: 1 },{ name: 'language', maxCount: 1 }]);
const FabricStarterClient = require('./fabric-starter-client');
let fabricStarterClient = new FabricStarterClient();
const Socket = require('./rest-socket-server');

// parse json payload and urlencoded params in GET
app.use(bodyParser.json({ limit: '100MB', type:'application/json'}));
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
        res.status(500).json(e.message);
        next();
      });
  };

// require presence of JWT in Authorization Bearer header
const jwtSecret = fabricStarterClient.getSecret();
app.use(jwt({secret: jwtSecret}).unless({path: ['/', '/users', '/mspid', /\/consortium/]}));

// use fabricStarterClient for every logged in user
const mapFabricStarterClient = {};

app.use(async (req, res, next) => {
  if (req.user) {
    const login = req.user.sub;

    let client = mapFabricStarterClient[login];
    if(client) {
      logger.debug('cached client for', login);
      fabricStarterClient = client;
    } else {
      logger.debug('new client for', login);
      await fabricStarterClient.init();

      try {
        await fabricStarterClient.loginOrRegister(login);
      } catch(e) {
        logger.error('loginOrRegister', e);
        res.status(500).json(e.message);
      }

      mapFabricStarterClient[login] = fabricStarterClient;
    }
  }
  next();
});

const appRouter = (app) => {

  app.get('/', (req, res) => {
    res.status(200).send('Welcome to fabric-starter REST server');
  });

  app.get('/mspid', (req, res) => {
    res.json(fabricStarterClient.getMspid());
  });

  //TODO use for development only as it may expose sensitive data
  app.get('/config', (req, res) => {
    res.json(fabricStarterClient.getNetworkConfig());
  });

  app.get('/chaincodes', asyncMiddleware(async (req, res, next) => {
    res.json(await fabricStarterClient.queryInstalledChaincodes());
  }));

  app.post('/chaincodes', cpUpload, asyncMiddleware(async (req, res, next) => {
      res.json(await fabricStarterClient.installChaincode(req.body.channelId, req.files['file'][0].originalname.substring(0, req.files['file'][0].originalname.length-4),
        req.files['file'][0].path, req.body.version, req.body.language, req.body.targets.split(','), storage));
  }));

  app.post('/users', asyncMiddleware(async (req, res, next) => {
    await fabricStarterClient.init();
    await fabricStarterClient.loginOrRegister(req.body.username, req.body.password);
    mapFabricStarterClient[req.body.username] = fabricStarterClient;

    const token = jsonwebtoken.sign({sub: fabricStarterClient.user.getName()}, jwtSecret);
    logger.debug('token', token);
    res.json(token);
  }));

  app.get('/channels', asyncMiddleware(async (req, res, next) => {
    res.json(await fabricStarterClient.queryChannels());
  }));

  app.post('/channels', asyncMiddleware(async (req, res, next) => {
      await fabricStarterClient.createChannel(req.body.channelId);
      res.json(await joinChannel(req.body.channelId));
  }));

    async function joinChannel(channelId) {
        try {
            const ret = await fabricStarterClient.joinChannel(channelId);
            socket.retryJoin(cfg.JOIN_RETRY_COUNT, async function () {
                await socket.updateServer(channelId);
            });
            return ret;
        } catch (error) {
            logger.error(error.message);
            return error.message;
        }
    }


  app.get('/channels/:channelId', asyncMiddleware(async (req, res, next) => {
    res.json(await fabricStarterClient.queryInfo(req.params.channelId));
  }));

  app.get('/channels/:channelId/orgs', asyncMiddleware(async (req, res, next) => {
    res.json(await fabricStarterClient.getOrganizations(req.params.channelId));
  }));

  app.get('/channels/:channelId/peers', asyncMiddleware(async (req, res, next) => {
    res.json(await fabricStarterClient.getPeersForOrgOnChannel(req.params.channelId));
  }));

  app.get('/orgs/:org/peers', asyncMiddleware(async (req, res, next) => {
    res.json(await fabricStarterClient.getPeersForOrg(req.params.org));
  }));

  app.post('/channels/:channelId/orgs', asyncMiddleware(async (req, res, next) => {
      res.json(fabricStarterClient.addOrgToChannel(req.params.channelId, req.body.orgId));
  }));

  app.post('/channels/:channelId', asyncMiddleware(async (req, res, next) => {
      res.json(await joinChannel(req.params.channelId));
  }));

  app.get('/channels/:channelId/blocks/:number', asyncMiddleware(async (req, res, next) => {
    res.json(await fabricStarterClient.queryBlock(req.params.channelId, parseInt(req.params.number)));
  }));

  app.get('/channels/:channelId/transactions/:id', asyncMiddleware(async (req, res, next) => {
    res.json(await fabricStarterClient.queryTransaction(req.params.channelId, req.params.id));
  }));

  app.get('/channels/:channelId/chaincodes', asyncMiddleware(async (req, res, next) => {
    res.json(await fabricStarterClient.queryInstantiatedChaincodes(req.params.channelId));
  }));

  app.post('/channels/:channelId/chaincodes', asyncMiddleware(async (req, res, next) => {
    res.json(await fabricStarterClient.instantiateChaincode(req.params.channelId, req.body.chaincodeId,
        req.body.type, req.body.fcn, req.body.args,  req.body.version,  req.body.targets));
  }));

  app.get('/channels/:channelId/chaincodes/:chaincodeId', asyncMiddleware(async (req, res, next) => {
    let ret = await fabricStarterClient.query(req.params.channelId, req.params.chaincodeId,
      req.query.fcn, req.query.args, req.query.targets);

    if(ret[0].startsWith('Error')) {
      throw new Error(ret[0]);
    }

    res.json(ret);
  }));

  app.post('/channels/:channelId/chaincodes/:chaincodeId', asyncMiddleware(async (req, res, next) => {
    res.json(await fabricStarterClient.invoke(req.params.channelId, req.params.chaincodeId,
      req.body.fcn, req.body.args, req.body.targets, req.query.waitForTransactionEvent));
  }));

  app.get('/consortium/members', asyncMiddleware(async (req, res, next) => {
    res.json(await fabricStarterClient.getConsortiumMemberList());
  }));


};

appRouter(app);

const server = app.listen(process.env.PORT || 3000, function () {
    logger.info('started fabric-starter rest server on port', server.address().port);
});

const socket = new Socket(fabricStarterClient);

socket.startSocketServer(server).then(() => {
    logger.info('started socket server');
});
