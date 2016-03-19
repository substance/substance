'use strict';

var CollabClient = require('../../collab/CollabClient');

function TestCollabClient(config) {
  TestCollabClient.super.apply(this, arguments);
  this.ws = config.ws;
}

TestCollabClient.Prototype = function() {
  this._initWebSocket = function() {
    this.ws = this.config.ws;
    this.ws.onopen = this._onWebSocketOpen.bind(this);
    this.ws.onclose = this._onWebSocketClose.bind(this);
  };

  this.serializeMessage = function(msg) {
    return msg;
  };

  this.deserializeMessage = function(msg) {
    return msg;
  };
};

CollabClient.extend(TestCollabClient);

module.exports = TestCollabClient;
