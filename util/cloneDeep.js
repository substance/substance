'use strict';

var _cloneDeep = require('lodash/cloneDeep');
var isFunction = require('lodash/isFunction');

function cloneDeep(obj) {
  if (obj && isFunction(obj.clone)) {
    return obj.clone();
  }
  return _cloneDeep(obj);
}

module.exports = cloneDeep;
