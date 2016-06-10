'use strict';

var EventEmitter = require('../../util/EventEmitter');
var uuid = require('../../util/uuid');
var __id__ = 0;

/**
  Simple TestWebSocket implementation for local testing
*/

function TestWebSocket(config) {
  TestWebSocket.super.apply(this);

  this.__id__ = __id__++;
  this.messageQueue = config.messageQueue;
  this.clientId = config.clientId || uuid();
  this.serverId = config.serverId || "server";

  // We consider our TestWebSocket WebSocket.CLOSED at the beginning
  this.readyState = 3;
  this._isSimulated = true;
}

TestWebSocket.Prototype = function() {

  this.connect = function() {
    this.messageQueue.connectClientSocket(this);
    this.readyState = 1; // WebSocket.OPEN
    this.triggerOpen();
  };

  this.disconnect = function() {
    this.messageQueue.disconnectClientSocket(this);
    this.readyState = 3; // WebSocket.CLOSED
    this.triggerClose();
  };

  /*
    Emulating native addEventListener API
  */
  this.addEventListener = function(eventName, handler) {
    if (this['on'+eventName]) {
      // For simplicity we only support a single handler per event atm
      console.warn('on'+eventName, ' is already set. Overriding handler.');
    }
    this['on'+eventName] = handler;
  };

  /*
    This can is called by the messageQueue once the connection is established
  */
  this.triggerOpen = function() {
    if (this.onopen) this.onopen();
  };

  this.triggerClose = function() {
    if (this.onclose) this.onclose();
  };

  /*
    Emulating native removeEventListener API
  */
  this.removeEventListener = function(eventName, handler) {
    delete this['on'+eventName];
  };

  /**
    Gets called by the message queue to handle a message
  */
  this._onMessage = function(data) {
    // Handler must be provided by user
    this.onmessage({data: data});
  };

  /**
    Gets called by the message queue to handle a message
  */
  this.send = function(data) {
    var msg = {
      from: this.clientId,
      to: this.serverId
    };
    if (data) {
      msg.data = data;
    }
    this.messageQueue.pushMessage(msg);
  };

};

EventEmitter.extend(TestWebSocket);

module.exports = TestWebSocket;
