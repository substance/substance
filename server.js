/* eslint-disable */

var express = require('express');
var path = require('path');
var glob = require('glob');
var browserify = require('browserify');
var PORT = process.env.PORT || 4201;
var app = express();

var config = require('./doc/config.json');
var generate = require('./doc/generator/generate');
var serverUtils = require('./util/server');

// use static server
app.use('/docs', express.static(path.join(__dirname, 'doc/assets')));
app.use('/docs/fonts', express.static(path.join(__dirname, 'node_modules/font-awesome/fonts')));

app.get('/docs/documentation.json', function(req, res) {
  var nodes = generate(config);
  res.json(nodes);
});

serverUtils.serveStyles(app, '/docs/app.css', path.join(__dirname, 'doc', 'app.scss'));
serverUtils.serveJS(app, '/docs/app.js', path.join(__dirname, 'doc', 'app.js'));

serverUtils.serveTestSuite(app, "test/**/*.test.js");

app.listen(PORT);
console.log('Server is listening on %s', PORT);
console.log('To view the docs go to http://localhost:%s/docs', PORT);
console.log('To run the test suite go to http://localhost:%s/test', PORT);
