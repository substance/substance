'use strict';

var merge = require('lodash/merge');
var mergeWith = require('lodash/mergeWith');
var isArray = require('lodash/isArray');

function _concatArrays(objValue, srcValue) {
  if (isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}

function _replaceArrays(objValue, srcValue) {
  if (isArray(objValue)) {
    return srcValue;
  }
}

/**
  Same as lodash/merge except that it provides options how to
  treat arrays.

  The default implementation overwrites elements.
   get concatenated rather than overwritten.
*/
module.exports = function(a, b, options) {
  options = options || {};
  var _with = null;
  switch (options.array) {
    case 'replace':
      _with = _replaceArrays;
      break;
    case 'concat':
      _with = _concatArrays;
      break;
  }
  if (_with) {
    return mergeWith(a, b, _with);
  } else {
    return merge(a, b);
  }
};
