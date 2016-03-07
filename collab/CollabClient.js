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
  this._onMessage = this._onMessage.bind(this);
  
  // Hard-coded for now
  this.scope = 'substance/collab';

  // Establish websocket connection
  this._initWebSocket();
}

CollabClient.Prototype = function() {

  /*
    Initialize websocket connection and handle reconnecting
  */
  this._initWebSocket = function() {
    console.log('Starting websocket connection:', this.config.wsUrl);

    this.ws = new window.WebSocket(this.config.wsUrl);
    this.ws.onopen = this._onWebSocketOpen.bind(this);
    this.ws.onclose = this._onWebSocketClose.bind(this);
    window.ws = this.ws; // for debugging purposes
  };

  this._connect = function() {
    this.ws.addEventListener('message', this._onMessage);
  };

  this._disconnect = function() {
    this.ws.removeEventListener('message', this._onMessage);
  };

  this._onWebSocketOpen = function() {
    this._connect();
    this.emit('connection', this.ws);
  };

  /*
    Reconnect if websocket gets closed for some reason
  */
  this._onWebSocketClose = function() {
    this._disconnect();
    this.emit('disconnect');
    console.log('websocket connection closed. Attempting to reconnect in 5s.');
    setTimeout(function() {
      this._initWebSocket();
    }.bind(this), 5000);
  };

  /*
    Delegate incoming websocket messages
  */
  this._onMessage = function(msg) {
    msg = this.deserializeMessage(msg.data);
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
    msg.scope = 'substance/collab';
    this.ws.send(this.serializeMessage(msg));
  };

  /*
    Returns true if websocket connection is open
  */
  this.isConnected = function() {
    return this.ws && this.ws.readyState === 1;
  };

  this.serializeMessage = function(msg) {
    return JSON.stringify(msg);
  };

  this.deserializeMessage = function(msg) {
    return JSON.parse(msg);
  };

};

EventEmitter.extend(CollabClient);

module.exports = CollabClient;
