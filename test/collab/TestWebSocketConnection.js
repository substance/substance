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

  var _super = TestWebSocketConnection.super.prototype;

  this._createWebSocket = function() {
    // this.config has messageQueue, clientId, serverId
    var ws = new TestWebSocket(this.config);
    return ws;
  };

  /*
    Manual connect
  */
  this.connect = function() {
    this._connect();
  };

  /*
    Manual disconnect
  */
  this.disconnect = function() {
    this._disconnect();
  };

  this._connect = function() {
    // Create websocket and bind events open/close/message
    _super._connect.apply(this, arguments);
    // connects websocket to the messageQueue and triggers 'open' event
    this.ws.connect();
  };

  this._disconnect = function() {
    this.ws.disconnect();
    _super._disconnect.apply(this, arguments);
  };

  this._onConnectionClose = function() {
    this.emit('close');
    // this._disconnect();
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