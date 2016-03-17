'use strict';

var CollabServer = require('../../collab/CollabServer');

function TestCollabServer() {
  TestCollabServer.super.apply(this, arguments);

  this._collaboratorId = 0;
}

TestCollabServer.Prototype = function() {

  this.serializeMessage = function(msg) {
    return msg;
  };

  this.deserializeMessage = function(msg) {
    return msg;
  };

  this._generateCollaboratorId = function() {
    return this._collaboratorId++;
  };
};

CollabServer.extend(TestCollabServer);

module.exports = TestCollabServer;
