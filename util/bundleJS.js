'use strict';

var extend = require('lodash/extend');
var browserify = require('browserify');

module.exports = function bundleJS(params, cb) {
  if (!params.sourcePath) throw new Error("'sourcePath' is required");
  params = extend({
    jsx: false,
    es6: false,
    cache: true,
  }, params);
  var opts = {
    debug: true,
    extensions: []
  };
  if (params.cache) {
    opts.cache = {};
    opts.packageCache = {};
  }
  if (params.jsx) {
    opts.extensions.push('.jsx');
  }
  var b = browserify(opts).add(params.sourcePath);

  var useBabelify = params.jsx || params.es6;
  if (useBabelify) {
    var plugins = [];
    var presets = [];
    if (params.jsx) {
      plugins.push("syntax-jsx");
      plugins.push(
        [ "transform-react-jsx", {
          // this will generate calls such as in
          // $$(MyComp, props, ...children)
          "pragma": "$$"
        }]
      );
    }
    if (params.es6 === true || params.es6 === "full") {
      plugins = plugins.concat(require('./_es6-babel-plugins'));
    } else if (params.es6 === "modules") {
      plugins.push(
        // support for es6 import/export
        // Note: the rest of es6 is supported natively by chrome
        ["transform-es2015-modules-commonjs-simple", {
          "noMangle": true,
          "addExports": true
        }]
      );
    }
    b = b.transform("babelify", {
      presets: presets,
      plugins: plugins
    });
  }
  b.bundle(function(err, buf) {
    if (err) {
      cb(err);
    } else {
      cb(null, buf);
    }
  });
}
