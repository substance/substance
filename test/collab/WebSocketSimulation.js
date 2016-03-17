'use strict';

var oo = require('../../util/oo');
var MessageQueue = require('./MessageQueue');
var TestWebSocket = require('./TestWebSocket');
var TestWebSocketServer = require('./TestWebSocketServer');

function WebSocketSimulation() {
  this.messageQueue = new MessageQueue();
  this.wss = new TestWebSocketServer(this.messageQueue, 'hub');
  this.wss.connect();
}

WebSocketSimulation.Prototype = function() {

  this.getServerSocket = function() {
    return this.wss;
  };

  this.createClientSocket = function(clientId) {
    var ws = new TestWebSocket(this.messageQueue, clientId, 'hub');
    return ws;
  };

  this.start = function() {
    this.messageQueue.flush();
    this.messageQueue.start();
  };

  this.stop = function() {
    this.messageQueue.stop();
    this.messageQueue.flush();
  };

};

oo.initClass(WebSocketSimulation);

module.exports = WebSocketSimulation;
