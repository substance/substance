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

  this._isSimulated = true;
}

WebSocket.Prototype = function() {

  this.connect = function() {
    this.messageQueue.connectClientSocket(this);
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

EventEmitter.extend(WebSocket);

module.exports = WebSocket;
