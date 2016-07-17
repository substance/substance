'use strict';

var extend = require('lodash/extend');
var browserify = require('browserify');

function _browserify(params, cb) {
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
    if (params.es6) {
      plugins.push(
        // support for es6 import/export
        // Note: the rest of es6 is supported natively
        // by the chrome
        // just import/export needs to be mapped to commonjs
        // so that browserify can work with it
        ["transform-es2015-modules-commonjs-simple", {
          "noMangle": true,
          "addExports": true
        }]
      );
    }
    b = b.transform("babelify", {
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

module.exports = _browserify;
