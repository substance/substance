'use strict';

var CollabServer = require('../../collab/CollabServer');

function TestCollabServer() {
  TestCollabServer.super.apply(this, arguments);
}

TestCollabServer.Prototype = function() {

  this.serializeMessage = function(msg) {
    return msg;
  };

  this.deserializeMessage = function(msg) {
    return msg;
  };

};

CollabServer.extend(TestCollabServer);

module.exports = TestCollabServer;
