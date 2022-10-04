const express = require('express')
const bodyParser = require('body-parser');

const app = express()
app.use(bodyParser.json({limit: '100MB', type: 'application/json'}));
app.use(bodyParser.urlencoded({extended: true, limit: '100MB'}));

module.exports = app