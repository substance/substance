"use strict";

var EventEmitter = require('./EventEmitter');
var uuid = require('./uuid');
var __id__ = 0;

/**
  Simple WebSocket implementation for local testing
*/

function WebSocket(messageQueue, clientId, serverId) {
  WebSocket.super.apply(this);

  this.__id__ = __id__++;
  this.messageQueue = messageQueue;
  this.clientId = clientId || uuid();
  this.serverId = serverId || "server";
}

WebSocket.Prototype = function() {

  this.connect = function() {
    this.messageQueue.connectClientSocket(this);
  };

  /**
    Gets called by the message queue to handle a message
  */
  this._onMessage = function(data) {
    var name = data[0];
    // var args = data.slice(1);

    if (name === 'open') {
      // Handler must be provided by user
      this.onopen();
    } else {
      // Handler must be provided by user
      this.onmessage({data: data});
    }
  };

  /**
    Gets called by the message queue to handle a message
  */
  this.send = function(data) {
    this.messageQueue.pushMessage({
      from: this.clientId,
      to: this.serverId,
      data: data
    });
  };

};

EventEmitter.extend(WebSocket);

module.exports = WebSocket;
