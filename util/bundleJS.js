'use strict';

import cloneDeep from 'lodash/cloneDeep'
import extend from 'lodash/extend'
import browserify from 'browserify'

export default function bundleJS(params, cb) {
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

