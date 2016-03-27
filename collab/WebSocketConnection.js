"use strict";

var ClientConnection = require('./ClientConnection');

/**
  Browser WebSocket abstraction. Handles reconnects etc.
*/
function WebSocketConnection() {
  WebSocketConnection.super.apply(this, arguments);
}

WebSocketConnection.Prototype = function() {

  var _super = WebSocketConnection.super.prototype;

  this._createWebSocket = function() {
    return new window.WebSocket(this.config.wsUrl);
  };

};

ClientConnection.extend(WebSocketConnection);
module.exports = WebSocketConnection;