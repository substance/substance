'use strict';

var EventEmitter = require('../../util/EventEmitter');
var uuid = require('../../util/uuid');
var __id__ = 0;

/**
  Simple TestWebSocket implementation for local testing
*/

function TestWebSocket(messageQueue, clientId, serverId) {
  TestWebSocket.super.apply(this);

  this.__id__ = __id__++;
  this.messageQueue = messageQueue;
  this.clientId = clientId || uuid();
  this.serverId = serverId || "server";

  // We consider our TestWebSocket connected right away.
  this.readyState = -1;
  this._isSimulated = true;
}

TestWebSocket.Prototype = function() {

  this.connect = function() {
    this.messageQueue.connectClientSocket(this);
  };

  this.disconnect = function() {
    this.messageQueue.disconnectClientSocket(this);
    this.readyState = -1;
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
    Emulating native removeEventListener API
  */
  this.removeEventListener = function(eventName, handler) {
    delete this['on'+eventName];
  };

  /**
    Gets called by the message queue to handle a message
  */
  this._onMessage = function(data) {
    var name = data[0];
    // var args = data.slice(1);

    if (name === 'open') {
      this.readyState = 1;
      // Handler must be provided by user
      if (this.onopen) {
        this.onopen();
      }
    } else {
      // Handler must be provided by user
      if (this.onmessage) {
        this.onmessage({data: data});
      }
    }
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
      // msg.data = JSON.parse(data);
      msg.data = data;
    }
    this.messageQueue.pushMessage(msg);
  };

};

EventEmitter.extend(TestWebSocket);

module.exports = TestWebSocket;
