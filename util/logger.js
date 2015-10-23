"use strict";

var EventEmitter = require("./event_emitter");
var OO = require("./oo");

// Logger
// ----------------
//

var Logger = function() {
  EventEmitter.call(this);

  this.messages = [];
};

Logger.Prototype = function() {

  this.addMessage = function(msg) {
    this.messages.push(msg);
    this.emit('messages:updated', this.messages);
  };

  this.log = function(msg) {
    this.addMessage({
      type: 'info',
      message: msg
    });
  };

  this.error = function(msg) {
    this.addMessage({
      type: 'error',
      message: msg
    });
  };

  this.warn = this.log;
  this.info = this.log;

  this.clearMessages = function() {
    this.messages = [];
    this.emit('messages:updated', this.messages);
  };
};

OO.inherit(Logger, EventEmitter);

module.exports = Logger;