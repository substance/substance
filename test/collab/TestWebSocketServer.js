"use strict";

var EventEmitter = require('../../util/EventEmitter');
var TestServerWebSocket = require('./TestServerWebSocket');

/*
  Local in-process Websocket server implementation for client-side development
  of protocols.

  @example

  ```js
  var messageQueue = new MessageQueue();
  var wss = new TestWebSocketServer(messageQueue);

  wss.on('connection', function(ws) {
    console.log(ws.clientId, 'connected to websocket server');

    ws.on('message', function(data) {
      console.log('data received on server');
    });
  });

  var ws1 = new WebSocket(messageQueue);

  ws1.onopen = function() {
    console.log('connection established for ws1');
  };

  ws1.onmessage = function(data) {
    console.log('data received', data);
  };
  ```
*/

function TestWebSocketServer(messageQueue, serverId) {
  TestWebSocketServer.super.apply(this);
  this.messageQueue = messageQueue;
  this.serverId = serverId || "server";
  this.clients = {};

  this._isSimulated = true;
}

TestWebSocketServer.Prototype = function() {

  this.connect = function() {
    this.messageQueue.connectServer(this);
  };

  this.disconnect = function() {
    // not implemented yet
    // this.messageQueue.disconnectServer(this);
    this.messageQueue.off(this);
  };

  /**
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
    // let server implementation know of the new connection
    this.emit('connection', sws);
    // telling the client we are ready for receiving messages
    sws.send(['open']);
  };

};

EventEmitter.extend(TestWebSocketServer);
module.exports = TestWebSocketServer;

