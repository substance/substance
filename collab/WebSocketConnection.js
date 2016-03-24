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

  /*
    Triggers a reconnect
  */
  this._onConnectionClose = function() {
    // Unregisters event listeners
    _super._onConnectionClose.apply(this, arguments);

    console.log('websocket connection closed. Attempting to reconnect in 5s.');
    setTimeout(function() {
      this._initConnection();
    }.bind(this), 5000);
  };

};

ClientConnection.extend(WebSocketConnection);
module.exports = WebSocketConnection;