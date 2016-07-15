"use strict";
/* eslint-disable no-console */

var path = require('path');
var each = require('lodash/each');
var isString = require('lodash/isString');

/**
  @module
  @example

  ```js
  var server = require('substance/util/server');
  ```
*/
var server = {};


/**
  Serves a bundled JS file. Browserify is used as a module bundler.

  @param {ExpressApplication} expressApp Express.js application instance
  @param {String} route Express route under which the bundled javascript should be served
  @param {String} sourcePath entry point for js bundling

  @example

  ```js
  server.serveJS(app, 'app.js', path.join(__dirname, 'src', 'app.js'));
  ```
*/
server.serveJS = function(expressApp, route, sourcePath) {
  var browserify = require('browserify');
  expressApp.get(route, function(req, res) {
    browserify({ debug: true, cache: false })
      .add(sourcePath)
      .bundle()
      .on('error', function(err) {
        console.error(err.message);
      })
      .pipe(res);
  });
};

/**
  Serves a bundled CSS file. For compilation Sass is used.

  @param {ExpressApplication} expressApp Express.js application instance
  @param {String} route Express route under which the styles should be served
  @param {Object} props either a configPath or a scssPath must be provided

  @example

  ```js
  server.serveStyles(app, '/app.css', path.join(__dirname, 'src', 'app.scss'));
  ```
*/
server.serveStyles = function(expressApp, route, props) {
  var bundleStyles = require('./bundleStyles');
  if (isString(props)) {
    console.warn("DEPRECATED: Use serveStyles(expressApp, '/app.css', {scssPath: 'app.scss'}");
    props = {
      scssPath: props
    };
  }
  expressApp.get(route, function(req, res) {
    bundleStyles(props, function(err, css) {
      if (err) {
        console.error(err);
        res.status(400).json(err);
      } else {
        res.set('Content-Type', 'text/css');
        res.send(css);
      }
    });
  });
};

server.serveHTML = function(expressApp, route, sourcePath, config) {
  var fs = require('fs');
  expressApp.get(route, function(req, res) {
    fs.readFile(sourcePath, function (err, data) {
      if (err) {
        res.status(500).json(err);
        return;
      }
      var html = data.toString();
      var metaTags = [];
      each(config, function(val, key) {
        metaTags.push('<meta name="'+key+'" content="'+val+'">');
      });
      html = html.replace('<!--CONFIG-->', metaTags.join(''));
      res.set('Content-Type', 'text/html');
      res.send(html);
    });
  });
};

server.serveTestSuite = function(expressApp, globPattern, options) {
  var browserify = require('browserify');
  var glob = require('glob');
  options = options || {};
  var cwd = process.cwd();
  // Test suite
  expressApp.get('/test/test.js', function (req, res) {
    glob(globPattern, {}, function (err, testfiles) {
      if (err || !testfiles || testfiles.length === 0) {
        console.error('No tests found.');
        res.send('500');
      } else {
        // console.log('Found test files:', testfiles);
        var b = browserify({ debug: true, cache: false });
        if (options.transforms) {
          options.transforms.forEach(function(t) {
            b.transform(t);
          });
        }
        // NOTE: adding this file first as this will launch
        // our customized version of tape for the browser.
        b.add(path.join(__dirname, '..', 'test', 'app.js'));
        b.add(testfiles.map(function(file) {
          return path.join(cwd, file);
        }))
        .bundle()
        .on('error', function(err){
          console.error(err.message);
        })
        .pipe(res);
      }
    });
  });
  var serveTestPage = function(req, res) {
    res.sendFile(path.join(__dirname, '..', 'test', 'index.html'));
  };
  expressApp.get('/test/index.html', serveTestPage);
  expressApp.get('/test', function(req, res) {
    res.redirect('/test/index.html');
  });
  server.serveStyles(expressApp, '/test/test.css', {scssPath: path.join(__dirname, '..', 'test', 'test.scss')});
};


module.exports = server;