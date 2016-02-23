'use strict';

var EventEmitter = require('../../util/EventEmitter');

/**
  Websocket server implementation for client-side development of protocols
*/

function MessageQueue() {
  MessageQueue.super.apply(this);

  this.connections = {};
  this.messages = [];
  this._log = [];
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

  this.flush = function() {
    while (this.messages.length) {
      this._processMessage();
    }
  };

  this.clear = function() {
    this.messages = [];
  };

  this.tick = function() {
    this._processMessage();
  };

  this.connectServer = function(server) {
    if(this.connections[server.serverId]) {
      throw new Error('Server already registered:' + server.serverId);
    }
    this.connections[server.serverId] = {
      type: 'server',
      serverId: server.serverId,
      server : server,
      sockets: {}
    };
  };

  /**
    A new client connects to the message queue
  */
  this.connectClientSocket = function(ws) {
    var serverId = ws.serverId;
    var clientId = ws.clientId;
    var conn = this.connections[serverId];
    if (!conn || conn.type !== "server") {
      throw new Error('Can not connect to server. Unknown server id.');
    }
    this.connections[ws.clientId] = {
      type: 'client',
      socket: ws
    };
    conn.server.handleConnectionRequest(clientId);
  };

  /*
    This is called by the server as a response to
    connection:requested. ws is the server-side end of
    the communication channel
  */
  this.connectServerSocket = function(ws) {
    var server = this.connections[ws.serverId];
    if (!server) {
      throw new Error('Server is not connected:' + ws.serverId);
    }
    server.sockets[ws.clientId] = ws;
  };

  /*
    Adds a message to the queue
  */
  this.pushMessage = function(message) {
    this.messages.push(message);
    this._log.push(message);
    this.emit('messages:updated', this.messages);
  };

  /*
    Takes one message off the queue and delivers it to the recipient
  */
  this._processMessage = function() {
    var message = this.messages.shift();
    if (!message) return; // nothing to process
    this.emit('messages:updated', this.messages);
    var from = message.from;
    var to = message.to;
    var recipient = this.connections[to];
    var socket;
    if (recipient.type === "server") {
      socket = recipient.sockets[from];
    } else {
      socket = recipient.socket;
    }
    if (!socket) {
      console.error('Could not deliver message:', message);
    } else {
      socket._onMessage(message.data);
    }
    this.emit('message:sent', message);
  };
};

EventEmitter.extend(MessageQueue);

module.exports = MessageQueue;
