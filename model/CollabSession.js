'use strict';

var DocumentSession = require('./DocumentSession');
var WebSocket = require('../util/WebSocket');

/**
  Session that supports collaboration.

  Keeps track of changes
*/

function CollabSession(doc, options) {
  CollabSession.super.call(this, doc, options);

  this.messageQueue = options.messageQueue;
  this.pendingChanges = [];

  this.ws = new WebSocket(this.messageQueue);

  this.ws.onopen = function() {
    console.log('connection established for ws1');
  };

  this.ws.onmessage = function(data) {
    console.log('data received', data);
  };
}

CollabSession.Prototype = function() {

};

DocumentSession.extend(CollabSession);

module.exports = CollabSession;
