"use strict";

var DocumentSession = require('./DocumentSession');
var DocumentChange = require('./DocumentChange');

var __id__ = 0;

/**
  Session that supports collaboration
*/

function CollabSession() {
  CollabSession.super.apply(this);

  this.pendingChanges = [];

  
}

CollabSession.Prototype = function() {

};

DocumentSession.extend(CollabSession);

module.exports = CollabSession;





