'use strict';

/* globals Promise */

var sass = require('node-sass');
var extend = require('lodash/extend');

// use this from within another process
// cb is optional
module.exports = function(params, cb) {
  return new Promise(function(resolve, reject) {
    var sassOptions = {};
    // per default source maps are enabled and embedded
    // only if explicitely disabled this is not done
    if (!params.sass || params.sass.sourceMap !== false) {
      sassOptions = {
        sourceMap: true,
        sourceMapEmbed: true,
        sourceMapContents: true,
      };
    }
    sassOptions = extend(sassOptions, params.sass);
    if (params.scssPath) {
      sassOptions.file = params.scssPath;
      sass.render(sassOptions, function(err, result) {
        if (err) cb(err);
        else cb(null, result.css);
      });
    } else {
      console.log('Bundling styles using a child process');
      var cp = require('child_process');
      var child = cp.fork(require.resolve('./_bundleStyles'));
      child.on('message', function(resultStr) {
        var scssContent = JSON.parse(resultStr);
        sassOptions.data = scssContent;
        sass.render(sassOptions, function(err, result) {
          if (err) reject(err);
          else resolve(result.css);
          // if used with callback
          if (cb) {
            if (err) cb(err);
            else cb(null, result.css);
          }
        });
      });
      child.on('error', function(err) {
        reject(err);
        // if used with callback
        if (cb) cb(err);
      });
      // this sends the params over to the child process
      child.send(JSON.stringify(params));
    }
  });
};

