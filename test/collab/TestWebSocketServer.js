'use strict';

var EventEmitter = require('../../util/EventEmitter');
var TestServerWebSocket = require('./TestServerWebSocket');

/*
  Local in-process Websocket server implementation for client-side development
  of protocols.
*/

function TestWebSocketServer(config) {
  TestWebSocketServer.super.apply(this);
  this.messageQueue = config.messageQueue;
  this.serverId = config.serverId || "server";
  this.clients = {};
  this._isSimulated = true;

  if (!config.manualConnect) {
    this.connect();
  }
}

TestWebSocketServer.Prototype = function() {

  this.connect = function() {
    this.messageQueue.connectServer(this);
  };

  /*
    New websocket connection requested. Creates the server-side
    counterpart of the websocket and registers it in the message
    queue.
  */
  this.handleConnectionRequest = function(clientId) {
    // TODO: this implementation does not allow for multiple connections
    // from one client to a server
    // and ATM we have only one server
    var sws = new TestServerWebSocket(this.messageQueue, this.serverId, clientId);
    this.messageQueue.connectServerSocket(sws);
    this.clients[clientId] = sws;
    // Emit connection event
    this.emit('connection', sws);
  };

  /*
    Disconnect an existing websocket
  */
  this.handleDisconnectRequest = function(clientId) {
    var sws = this.clients[clientId];
    this.messageQueue.disconnectServerSocket(sws);

    // Emit close event on websocket server
    sws.emit('close', sws);
    delete this.clients[clientId];
  };

};

EventEmitter.extend(TestWebSocketServer);
module.exports = TestWebSocketServer;

