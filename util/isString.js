'use strict';

var _isString = require('lodash/isString');
var UnicodeString = require('./UnicodeString');

module.exports = function(str) {
  return (str instanceof UnicodeString || _isString(str));
};
