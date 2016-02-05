"use strict";

var EventEmitter = require('./EventEmitter');
var uuid = require('uuid');

/**
  Simple WebSocket implementation for local testing
*/

function WebSocket(messageQueue) {
  WebSocket.super.apply(this);
  this.messageQueue = messageQueue;

  this.clientId = uuid();

  // This connects the new client socket to the message queue
  // Once the connection with the server is established, we
  // receive an 'open' event and we are ready to send and
  // receive messages.
  messageQueue.connect(this);
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
      to: this.clientId+':hub',
      data: data
    });
  };
};

EventEmitter.extend(WebSocket);

module.exports = WebSocket;
