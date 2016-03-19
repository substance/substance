'use strict';

var EventEmitter = require('../../util/EventEmitter');

var __id__ = 0;

/**
  Simple TestServerWebSocket implementation for local testing
*/

function TestServerWebSocket(messageQueue, serverId, clientId) {
  TestServerWebSocket.super.apply(this);

  this.__id__ = __id__++;
  this.messageQueue = messageQueue;
  this.serverId = serverId;
  this.clientId = clientId;

  this._isSimulated = true;
  this.readyState = 1; // consider always connected
}

TestServerWebSocket.Prototype = function() {

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

EventEmitter.extend(TestServerWebSocket);

module.exports = TestServerWebSocket;
