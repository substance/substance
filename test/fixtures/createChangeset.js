'use strict';

var isFunction = require('lodash/isFunction');
var DocumentSession = require('../../model/DocumentSession');

module.exports = function(doc, fn) {
  if (!doc._isDocument || !isFunction(fn)) {
    throw new Error('Illegal arguments');
  }
  var session = new DocumentSession(doc);
  var change = session.transaction(fn);
  return [change.toJSON()];
};
