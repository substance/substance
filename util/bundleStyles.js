'use strict';

var sass = require('node-sass');

// use this from within another process
// cb is optional
module.exports = function(params, cb) {
  return new Promise(function(resolve, reject) {
    var cp = require('child_process');
    var child = cp.fork(require.resolve('./_bundleStyles'));
    child.on('message', function(resultStr) {
      var scssContent = JSON.parse(resultStr);
      var sassOptions = {
        sourceMap: true,
        sourceMapEmbed: true,
        sourceMapContents: true,
        // outFile: params.scssPath
      };
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
  });
};

