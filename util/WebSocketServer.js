"use strict";

var EventEmitter = require('./EventEmitter');
var ServerWebSocket = require('./ServerWebSocket');

/*
  Local in-process Websocket server implementation for client-side development
  of protocols.

  @example
  
  ```js
  var messageQueue = new MessageQueue();
  var wss = new WebSocketServer(messageQueue);

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

function WebSocketServer(messageQueue) {
  WebSocketServer.super.apply(this);
  this.messageQueue = messageQueue;

  this.messageQueue.connect(this, {
    'connection:requested': this._connectionRequested
  });

  this.clients = {};
}

WebSocketServer.Prototype = function() {

  /**
    New websocket connection requested. Creates the server-side
    counterpart of the websocket and registers it in the message
    queue.
  */
  this._connectionRequested = function(clientId) {
    var serverClientId = clientId+'-server';
    var sws = new ServerWebSocket(this.messageQueue, serverClientId);
    this.messageQueue.connectServerClient(sws);

    this.clients[serverClientId] = sws;
    this.emit('connection', sws); // hub implementers use this to register a new connection
    sws.send(['open']); // tell the client we are ready for receiving messages
  };

};

EventEmitter.extend(WebSocketServer);
module.exports = WebSocketServer;

