var browserify = require("browserify");
var sass = require('node-sass');

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

  @param {ExpressApplication} app Express.js application instance
  @param {String} route Express route under which the bundled javascript should be served
  @param {String} sourcePath entry point for js bundling

  @example

  ```js
  server.serveJS(app, 'app.js', path.join(__dirname, 'src', 'app.js'));
  ```
*/
server.serveJS = function(app, route, sourcePath) {
  app.get(route, function(req, res) {
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

  @param {ExpressApplication} app Express.js application instance
  @param {String} route Express route under which the styles should be served
  @param {String} sourcePath entry point for sass compilation

  @example

  ```js
  server.serveStyles(app, '/app.css', path.join(__dirname, 'src', 'app.scss'));
  ```
*/
server.serveStyles = function(app, route, sourcePath) {
  app.get(route, function(req, res) {
    sass.render({
      file: sourcePath,
      sourceMap: true,
      sourceMapEmbed: true,
      outFile: 'app.css',
    }, function(err, result) {
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



module.exports = server;