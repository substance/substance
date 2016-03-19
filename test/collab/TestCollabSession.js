'use strict';

var CollabSession = require('../../collab/CollabSession');
var DocumentChange = require('../../model/DocumentChange');

function TestCollabSession() {
  TestCollabSession.super.apply(this, arguments);
}

TestCollabSession.Prototype = function() {

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