"use strict";

var EventEmitter = require('./EventEmitter');
var ServerWebSocket = require('./ServerWebSocket');
var uuid = require('./uuid');

/**
  Websocket server implementation for client-side development of protocols
*/

function MessageQueue() {
  MessageQueue.super.apply(this);

  this.clients = {};
  this.messages = [];
  setInterval(this._processMessage.bind(this), 20);
}

MessageQueue.Prototype = function() {
  /**
    A new client connects to the message queue
  */
  this.connect = function(ws) {
    this.clients[ws.clientId] = ws;

    this.emit('connection:requested', ws.clientId);
  };

  this.pushMessage = function(message) {
    this.messages.push(message);
  };

  this._processMessage = function() {
    var message = this.messages.shift();
    var to = message.to;
    var from = message.from;
    this.clients[to]._onMessage(message.data);
  };
};

EventEmitter.extend(QuasiWebSocketServer);

module.exports = QuasiWebSocketServer;
