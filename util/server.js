"use strict";
/* eslint-disable no-console */

var browserify = require('browserify');
var sass = require('node-sass');
var fs = require('fs');
var each = require('lodash/each');
var isString = require('lodash/isString');
var Configurator = require('./Configurator');


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
  if (isString(props)) {
    console.warn("DEPRECATED: Use serveStyles(expressApp, '/app.css', {scssPath: 'app.scss'}");
    props = {
      scssPath: props
    };
  }

  expressApp.get(route, function(req, res) {
    var sassOptions = {
      sourceMap: true,
      sourceMapEmbed: true,
      outFile: 'app.css'
    };

    if (props.configPath) {
      var config = require(props.configPath);
      var ConfiguratorClass = props.ConfiguratorClass || Configurator;
      var configurator = new ConfiguratorClass(config);
      var scssFiles = configurator.getStyles();
      var scssContent = scssFiles.map(function(scssFile) {
        return "@import '"+scssFile+"';";
      }).join('\n');
      sassOptions.data = scssContent;
    } else {
      sassOptions.file = props.scssPath;
    }

    sass.render(sassOptions, function(err, result) {
      if (err) {
        console.error(err);
        res.status(400).json(err);
      } else {
        res.set('Content-Type', 'text/css');
        res.send(result.css);
      }
    });
  });
};

server.serveHTML = function(expressApp, route, sourcePath, config) {
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


module.exports = server;