"use strict";

var EventEmitter = require('../util/EventEmitter');
var __id__ = 0;

/**
  Client for CollabServer API

  Communicates via websocket for real-time operations
*/
function CollabClient(config) {
  CollabClient.super.apply(this);

  this.__id__ = __id__++;
  this.config = config;
  this.connection = config.connection;
  
  // Hard-coded for now
  this.scope = 'substance/collab';

  // Bind handlers
  this._onMessage = this._onMessage.bind(this);
  this._onConnectionOpen = this._onConnectionOpen.bind(this);
  this._onConnectionClose = this._onConnectionClose.bind(this);

  // Connect handlers
  this.connection.on('open', this._onConnectionOpen);
  this.connection.on('close', this._onConnectionClose);
  this.connection.on('message', this._onMessage);
}

CollabClient.Prototype = function() {

  this._onConnectionClose = function() {
    this.emit('disconnected');
  };

  this._onConnectionOpen = function() {
    this.emit('connected');
  };

  /*
    Delegate incoming messages from the connection
  */
  this._onMessage = function(msg) {
    if (msg.scope === this.scope) {
      this.emit('message', msg);
    } else {
      console.info('Message ignored. Not sent in hub scope', msg);
    }
  };

  /*
    Send message via websocket channel
  */
  this.send = function(msg) {
    if (!this.connection.isOpen()) {
      console.error('Message could not be sent. Connection not open.', msg);
      return;
    }

    msg.scope = this.scope;
    if (this.config.enhanceMessage) {
      msg = this.config.enhanceMessage(msg);
    }
    this.connection.send(msg);
  };

  /*
    Returns true if websocket connection is open
  */
  this.isConnected = function() {
    return this.connection.isOpen();
  };
};

EventEmitter.extend(CollabClient);

module.exports = CollabClient;
