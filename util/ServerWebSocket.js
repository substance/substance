"use strict";

var EventEmitter = require('./EventEmitter');

var __id__ = 0;

/**
  Simple ServerWebSocket implementation for local testing
*/

function ServerWebSocket(messageQueue, serverId, clientId) {
  ServerWebSocket.super.apply(this);

  this.__id__ = __id__++;
  this.messageQueue = messageQueue;
  this.serverId = serverId;
  this.clientId = clientId;

  this._isSimulated = true;
}

ServerWebSocket.Prototype = function() {

  this.connect = function() {
    this.messageQueue.connectServerSocket(this);
  };

  /**
    Gets called by the message queue to handle a message
  */
  this._onMessage = function(data) {
    this.emit('message', data);
  };

  /**
    Gets called by the message queue to handle a message
  */
  this.send = function(data) {
    var msg = {
      from: this.serverId,
      to: this.clientId
    };
    if (data) {
      // msg.data = JSON.parse(data);
      msg.data = data;
    }
    this.messageQueue.pushMessage(msg);
  };
};

EventEmitter.extend(ServerWebSocket);

module.exports = ServerWebSocket;
