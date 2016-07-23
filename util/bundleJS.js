'use strict';

var cloneDeep = require('lodash/cloneDeep');
var extend = require('lodash/extend');
var browserify = require('browserify');

module.exports = function bundleJS(params, cb) {
  if (!params.sourcePath) throw new Error("'sourcePath' is required");
  var opts = extend({}, params.browserify);
  // console.log('#### browserify options', opts);
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
};

