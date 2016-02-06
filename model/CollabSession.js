'use strict';

var DocumentSession = require('./DocumentSession');

/**
  Session that supports collaboration
*/

function CollabSession(doc, options) {
  CollabSession.super.call(this, doc, options);

  this.messageQueue = options.messageQueue;
  this.pendingChanges = [];
}

CollabSession.Prototype = function() {

};

DocumentSession.extend(CollabSession);

module.exports = CollabSession;
