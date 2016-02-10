"use strict";

var EventEmitter = require('./EventEmitter');
var uuid = require('./uuid');

var __id__ = 0;

/**
  Simple WebSocket implementation for local testing
*/

function WebSocket(messageQueue, clientId) {
  WebSocket.super.apply(this);
  this.__id__ = __id__++;

  this.messageQueue = messageQueue;
  this.clientId = clientId || uuid();

  // This connects the new client socket to the message queue
  // Once the connection with the server is established, we
  // receive an 'open' event and we are ready to send and
  // receive messages.
  setTimeout(function() {
    messageQueue.connectClient(this);
  }.bind(this), 20);
}

WebSocket.Prototype = function() {
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
      this.onmessage(data);
    }
  };

  /**
    Gets called by the message queue to handle a message
  */
  this.send = function(data) {
    this.messageQueue.pushMessage({
      from: this.clientId,
      to: this.clientId+"-server",
      data: data
    });
  };

};

EventEmitter.extend(WebSocket);

module.exports = WebSocket;
