var express = require('express');
var path = require('path');
var glob = require('glob');
var browserify = require('browserify');
var sass = require('node-sass');
var PORT = process.env.PORT || 4201;
var app = express();

var config = require('./doc/config.json');
var generate = require('./doc/generator/generate');

// use static server
app.use('/doc', express.static(path.join(__dirname, 'doc/assets')));
app.use('/i18n', express.static(path.join(__dirname, 'i18n')));

app.get('/documentation.json', function(req, res) {
  var nodes = generate(config);
  res.json(nodes);
});

app.get('/doc/app.js', function (req, res) {
  browserify({ debug: true, cache: false })
    .add(path.join(__dirname, 'doc', 'app.js'))
    .bundle()
    .on('error', function(err){
      console.error(err.message);
      res.send('console.log("'+err.message+'");');
    })
    .pipe(res);
});

var handleError = function(err, res) {
  console.error(err);
  res.status(400).json(err);
};

var renderSass = function(cb) {
  sass.render({
    file: path.join(__dirname, 'doc', 'app.scss'),
    sourceMap: true,
    outFile: 'app.css',
  }, cb);
};

// use static server
app.use(express.static(__dirname));

app.get('/doc/app.css', function(req, res) {
  renderSass(function(err, result) {
    if (err) return handleError(err, res);
    res.set('Content-Type', 'text/css');
    res.send(result.css);
  });
});

app.get('/doc/app.css.map', function(req, res) {
  renderSass(function(err, result) {
    if (err) return handleError(err, res);
    res.set('Content-Type', 'text/css');
    res.send(result.map);
  });
});

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
app.use(express.static(__dirname));
app.listen(PORT);
console.log('Server is listening on %s', PORT);
console.log('To view the docs go to http://localhost:%s/doc', PORT);
console.log('To run the test suite go to http://localhost:%s/test', PORT);
