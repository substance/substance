"use strict";

var EventEmitter = require('../util/EventEmitter');
var warn = require('../util/warn');
var info = require('../util/info');
var Err = require('../util/SubstanceError');
var __id__ = 0;

/**
  ClientConnection abstraction. Uses websockets internally
*/
function ClientConnection(config) {
  ClientConnection.super.apply(this);

  this.__id__ = __id__++;
  this.config = config;
  this._onMessage = this._onMessage.bind(this);
  this._onConnectionOpen = this._onConnectionOpen.bind(this);
  this._onConnectionClose = this._onConnectionClose.bind(this);

  // Establish websocket connection
  this._connect();
}

ClientConnection.Prototype = function() {

  this._createWebSocket = function() {
    throw Err('AbstractMethodError');
  };

  /*
    Initializes a new websocket connection
  */
  this._connect = function() {
    this.ws = this._createWebSocket();
    this.ws.addEventListener('open', this._onConnectionOpen);
    this.ws.addEventListener('close', this._onConnectionClose);
    this.ws.addEventListener('message', this._onMessage);
  };

  /*
    Disposes the current websocket connection
  */
  this._disconnect = function() {
    this.ws.removeEventListener('message', this._onMessage);
    this.ws.removeEventListener('open', this._onConnectionOpen);
    this.ws.removeEventListener('close', this._onConnectionClose);
    this.ws = null;
  };

  /*
    Emits open event when connection has been established
  */
  this._onConnectionOpen = function() {
    this.emit('open');
  };

  /*
    Trigger reconnect on connection close
  */
  this._onConnectionClose = function() {
    this._disconnect();
    this.emit('close');
    info('websocket connection closed. Attempting to reconnect in 5s.');
    setTimeout(function() {
      this._connect();
    }.bind(this), 5000);
  };

  /*
    Delegate incoming websocket messages
  */
  this._onMessage = function(msg) {
    msg = this.deserializeMessage(msg.data);
    this.emit('message', msg);
  };

  /*
    Send message via websocket channel
  */
  this.send = function(msg) {
    if (!this.isOpen()) {
      warn('Message could not be sent. Connection is not open.', msg);
      return;
    }
    this.ws.send(this.serializeMessage(msg));
  };

  /*
    Returns true if websocket connection is open
  */
  this.isOpen = function() {
    return this.ws && this.ws.readyState === 1;
  };

  this.serializeMessage = function(msg) {
    return JSON.stringify(msg);
  };

  this.deserializeMessage = function(msg) {
    return JSON.parse(msg);
  };

};

EventEmitter.extend(ClientConnection);
module.exports = ClientConnection;
