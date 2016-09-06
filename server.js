/* eslint-disable strict, no-console */
var express = require('express');
var path = require('path');
var PORT = process.env.PORT || 4201;
var app = express();
var config = require('./doc/config.json');
var generate = require('./doc/generator/generate');
var serverUtils = require('./util/server');
var browserifyConfig = {
  debug: true
};

app.get('/docs/documentation.json', function(req, res) {
  var nodes = generate(config);
  res.json(nodes);
});

serverUtils.serveJS(app, '/docs/app.js', {
  sourcePath: path.join(__dirname, 'doc', 'app.js'),
  browserify: browserifyConfig,
});

serverUtils.serveTestSuite(app, "test/**/*.test.js");

// TODO: Use Substance bundler instead for static serving tasks
app.use('/test/test.css', express.static(path.join(__dirname, 'test', 'test.css')));
app.use('/docs', express.static(path.join(__dirname, 'doc')));
app.use('/docs', express.static(path.join(__dirname, 'doc/assets')));
app.use('/docs', express.static(path.join(__dirname, 'node_modules')));
app.use('/docs', express.static(path.join(__dirname)));

app.listen(PORT);
console.log('Server is listening on %s', PORT);
console.log('To view the docs go to http://localhost:%s/docs', PORT);
console.log('To run the test suite go to http://localhost:%s/test', PORT);
