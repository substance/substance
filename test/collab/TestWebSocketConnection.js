"use strict";

var ClientConnection = require('../../collab/ClientConnection');
var TestWebSocket = require('./TestWebSocket');

/*
  Browser WebSocket abstraction. Handles reconnects etc.
*/
function TestWebSocketConnection() {
  TestWebSocketConnection.super.apply(this, arguments);
}

TestWebSocketConnection.Prototype = function() {

  // var _super = TestWebSocketConnection.super.prototype;

  this._createWebSocket = function() {
    // this.config has messageQueue, clientId, serverId
    var ws = new TestWebSocket(this.config);
    if (!this.config.manualConnect) {
      ws.connect();
    }
    return ws;
  };

  /*
    Used for manual websocket connect
  */
  this.connect = function() {
    this.ws.connect();
  };

  /*
    Our message queue holds JS objects already so we just
    pass through the msg
  */
  this.serializeMessage = function(msg) {
    return msg;
  };

  this.deserializeMessage = function(msg) {
    return msg;
  };

};

ClientConnection.extend(TestWebSocketConnection);
module.exports = TestWebSocketConnection;