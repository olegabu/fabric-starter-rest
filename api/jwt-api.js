const _ = require('lodash');
const jwt = require('express-jwt');
const jsonwebtoken = require('jsonwebtoken');
const asyncMiddleware = require('../api/async-middleware-error-handler');
const cfg = require('../config.js');
const logger = cfg.log4js.getLogger('jwt-api');

// // fabric client
const FabricStarterClient = require('../fabric-starter-client'); //todo: move to fabricStarterRuntime
const x509util = require('../util/x509-util');

module.exports = function (app, server, defaultFabricStarterClient) {

    // use fabricStarterClient for every logged in user
    const mapFabricStarterClient = {}; //todo: have clients cache in fabricStarterRuntime


    // require presence of JWT in Authorization Bearer header
    //   const jwtSecret = fabricStarterClient.getSecret();
    const jwtSecret = defaultFabricStarterClient.getSecret();
    app.use(jwt({secret: jwtSecret}).unless({
        path: ['/', '/users', /\/jwt\/.*/, '/domain', '/mspid', '/config',
            new RegExp('/api-docs'), '/api-docs.json', /\/webapp/, /\/webapps\/.*/, '/admin/', /\/admin\/.*/, '/msp/', /\/integration\/.*/]
    }));

    app.use((req, res, next) => {
        if (req.user) {
            const login = req.user.sub;
            let client = mapFabricStarterClient[login];
            if (client) {
                logger.debug('cached client for', login);
                req.fabricStarterClient = client;
            } else {
                throw (new jwt.UnauthorizedError("No client context", {message: 'User is not logged in.'}));//todo: move to runtime
            }
        }
        next();
    })

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
    app.post('/users', asyncMiddleware(async (req, res, next) => {
        // let namePasswordKey=`${req.body.username}.${req.body.password}`;
        // if(!mapFabricStarterClient[namePasswordKey]) {
        // }
        mapFabricStarterClient[req.body.username] && mapFabricStarterClient[req.body.username].logoutUser(req.body.username);
        mapFabricStarterClient[req.body.username] = new FabricStarterClient(); //todo: client should be created in fabricStarterRuntime
        req.fabricStarterClient = mapFabricStarterClient[req.body.username];

        await req.fabricStarterClient.loginOrRegister(req.body.username, req.body.password || req.body.username);

        let certSubject = x509util.getSubject(req.fabricStarterClient.user.getIdentity()._certificate);
        let jwtPayload = _.assign({sub: req.fabricStarterClient.user.getName()}, certSubject);
        const token = jsonwebtoken.sign(jwtPayload, jwtSecret, {expiresIn: cfg.AUTH_JWT_EXPIRES_IN})
        logger.debug('token', token);
        res.json(token);
    }));

    /**
     * Verify JWT token.
     * @route POST /jwt/verify
     * @group auth - Authentication and verification
     * @param {jwt} jwt.body.required
     * @returns {object} 200 - JWT is correct
     * @returns {Error}  500  - JWT is malformed or expired
     */
    app.post('/jwt/verify', asyncMiddleware(async (req, res, next) => {
        logger.debug("Verifying JWT Token", req.body);
        jsonwebtoken.verify(_.get(req,'body.jwt'), jwtSecret)
        res.status(200);
        res.json("OK");
    }));
}