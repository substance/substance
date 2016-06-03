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

app.use('/i18n', express.static(path.join(__dirname, 'i18n')));

app.get('/docs/documentation.json', function(req, res) {
  var nodes = generate(config);
  res.json(nodes);
});

serverUtils.serveStyles(app, '/docs/app.css', path.join(__dirname, 'doc', 'app.scss'));
serverUtils.serveJS(app, '/docs/app.js', path.join(__dirname, 'doc', 'app.js'));

// Test suite
app.get('/test/test.js', function (req, res, next) {
  glob("test/**/*.test.js", {}, function (er, testfiles) {
    if (er || !testfiles || testfiles.length === 0) {
      console.error('No tests found.');
      res.send('500');
    } else {
      // console.log('Found test files:', testfiles);
      browserify({ debug: true })
        .add(path.join(__dirname, 'test', 'test-globals.js'))
        .add(testfiles.map(function(file) {
          return path.join(__dirname, file);
        }))
        .bundle()
        .on('error', function(err){
          console.error(err.message);
          res.status(500).send('console.log("'+err.message+'");');
          next();
        })
        .pipe(res);
    }
  });
});

// Provide static routes for testing
// for accessing test/index.html and for fixtures
// NOTE: '/base' is necessary to be compatible with karma
app.use('/test', express.static(__dirname + '/test'));
app.use('/base/test', express.static(__dirname + '/test'));

app.listen(PORT);
console.log('Server is listening on %s', PORT);
console.log('To view the docs go to http://localhost:%s/docs', PORT);
console.log('To run the test suite go to http://localhost:%s/test', PORT);
