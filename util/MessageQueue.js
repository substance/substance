"use strict";

var EventEmitter = require('./EventEmitter');

/**
  Websocket server implementation for client-side development of protocols
*/

function MessageQueue(options) {
  options = options || {};
  MessageQueue.super.apply(this);

  this.clients = {};
  this.messages = [];
}

MessageQueue.Prototype = function() {

  /*
    Starts queue processing
  */
  this.start = function() {
    this._interval = setInterval(this._processMessage.bind(this), 100);  
  };

  /*
    Stops the queue processing
  */
  this.stop = function() {
    clearInterval(this._interval);
  };

  this.tick = function() {
    this._processMessage();
  };

  /**
    A new client connects to the message queue
  */
  this.connectClient = function(ws) {
    this.clients[ws.clientId] = ws;
    this.emit('connection:requested', ws.clientId);
  };

  /*
    This is called by the server as a response to
    connection:requested. ws is the server-side end of
    the communication channel
  */
  this.connectServerClient = function(ws) {
    this.clients[ws.clientId] = ws;
  };

  /*
    Adds a message to the queue
  */
  this.pushMessage = function(message) {
    this.messages.push(message);
    this.emit('messages:updated', this.messages);
  };



  /*
    Takes one message off the queue and delivers it to the recepient
  */
  this._processMessage = function() {
    var message = this.messages.shift();
    if (!message) return; // nothing to process
    this.emit('messages:updated', this.messages);
    var to = message.to;
    // var from = message.from;
    this.clients[to]._onMessage(message.data);
  };
};

EventEmitter.extend(MessageQueue);

module.exports = MessageQueue;
