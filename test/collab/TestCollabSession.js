'use strict';

var CollabSession = require('../../collab/CollabSession');
var DocumentChange = require('../../model/DocumentChange');

function TestCollabSession() {
  TestCollabSession.super.apply(this, arguments);

  this._incomingMessages = [];
  this._outgoingMessages = [];
}

TestCollabSession.Prototype = function() {

  var _super = TestCollabSession.super.prototype;

  /*
    We log received messages so we can later dump the session
    history and replay in test cases.
  */
  this._onMessage = function(msg) {
    if (this.config.logging) {
      this._incomingMessages.push(msg);      
    }
    _super._onMessage.apply(this, arguments);
  };

  /*
    We log sent messages so we can later dump the session
    history and replay in test cases.
  */
  this._onSend = function(msg) {
    if (this.config.logging) {
      this._outgoingMessages = [];
      this._outgoingMessages.push(msg);      
    }
    _super._onSend.apply(this, arguments);
  };

  this.dumpIncomingMessages = function() {
    return JSON.stringify(this._incomingMessages, null, '  ');
  };

  this.dumpOutgoingMessages = function() {
    return JSON.stringify(this._outgoingMessages, null, '  ');
  };

  this.serializeMessage = function(msg) {
    return msg;
  };

  this.deserializeMessage = function(msg) {
    return msg;
  };

  this.serializeChange = function(change) {
    return change.toJSON();
  };

  this.deserializeChange = function(serializedChange) {
    return DocumentChange.fromJSON(serializedChange);
  };
};

CollabSession.extend(TestCollabSession);

module.exports = TestCollabSession;