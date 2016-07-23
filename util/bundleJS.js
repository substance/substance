'use strict';

var cloneDeep = require('lodash/cloneDeep');
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
  if (params.babel) {
    b = b.transform("babelify", cloneDeep(params.babel));
  }
  b.bundle(function(err, buf) {
    if (err) {
      cb(err);
    } else {
      cb(null, buf);
    }
  });
}
