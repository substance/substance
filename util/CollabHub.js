"use strict";

var EventEmitter = require('./EventEmitter');
var forEach = require('lodash/forEach');
var DocumentChange = require('../model/DocumentChange');
var CollabSession = require('../model/CollabSession');
var uuid = require('./uuid');

/*
  Hub for realizing collaborative editing. Implements the server-end of the
  protocol.

  @class

  @param {WebsocketServer} wss a websocket server instance
  @param {Store} a substance changes store instance

  A typical communication flow between client and hub looks like this:

    -> ['open', 'doc1']
    <- ['open:confirmed']
    -> ['commit', [c1,c2,c3], 25]
    <- ['commit:confirmed']
    <- ['update', [c4,c5], 26]
    -> ['close', 'doc1']

  @example

  ```js
  var hub = new CollabHub(wss, store);
  ```
*/


function CollabHub(wss, store) {
  CollabHub.super.apply(this);

  this.wss = wss;

  // where docs (change history is stored)
  this.store = store;

  this._connections = {};
  this._onConnection = this._onConnection.bind(this);
  this.wss.on('connection', this._onConnection);
}

CollabHub.Prototype = function() {

  this.dispose = function() {
    this.wss.off(this);
  };

  /*
    For a given web socket get all other websockets (aka collaborators)

    collaborator(docId): client !== ws && ws.documentId === documentId
  */
  this.getCollaboratorSockets = function(ws, documentId) {
    var collabs = [];
    forEach(this._connections, function(conn) {
      if (conn.documentId === documentId && conn.socket !== ws) {
        collabs.push(conn.socket);
      }
    });
    return collabs;
  };

  /*
    When a new collaborator connects

    Note: No data is exchanged yet.
  */
  this._onConnection = function(ws) {
    // HACK: we would like to have an id for the native sockets
    // but there seems not be something like this.
    // Thus we store our own there, which we want to use for dispatching
    if (!ws.clientId) {
      ws.clientId = uuid();
    }

    // TODO: add a way to disconnect a client
    var clientId = ws.clientId;
    var connection = {
      clientId: clientId,
      socket: ws,
      onMessage: this._onMessage.bind(this, ws),
      documentId: null
    };
    if (this._connections[clientId]) {
      throw new Error('Client is already connected.');
    }
    this._connections[clientId] =  connection;
    ws.on('message', connection.onMessage);
  };

  /*
    Handling of client messages.

    Message comes in in the following format:

    ['open', 'doc13']

    We turn this into a method call internally:

    this.open(ws, 'doc13')

    The first argument is always the websocket so we can respond to messages
    after some operations have been performed.
  */
  this._onMessage = function(ws, msg) {
    msg = this.deserializeMessage(msg);
    var method = msg[0];
    var docId, version, change;
    switch(method) {
      case 'open':
      case 'commit':
        docId = msg[1];
        version = msg[2];
        if (msg[3]) {
          change = this.deserializeChange(msg[3]);
        }
        this[method](ws, docId, version, change);
        break;
      case 'updateSelection':
        docId = msg[1];
        version = msg[2];
        if (msg[3]) {
          change = this.deserializeChange(msg[3]);
        }
        this[method](ws, docId, version, change);
        break;
      default:
        console.error('CollabHub: unsupported message', method, msg);
    }
 };

  /*
    First thing the client sends to initialize the collaborative editing
    session.

    @param ws
    @param documentId
    @param version The client's document version (0 if client starts with an empty doc)
    @param change pending client change

    Note: a client can reconnect having a pending change
    which is similar to the commit case
  */
  this.open = function(ws, documentId, version, change) {
    var conn = this._connections[ws.clientId];
    if (!conn) {
      throw new Error('Client not registered', ws.clientId);
    }
    // We keep the documentId for this socket instance. That way we know at which
    // document a client is looking at. ATM we support only one active doc editing
    // session per client.
    if (conn.documentId) {
      console.error('Client is already registered for document', conn.documentId);
    }
    conn.documentId = documentId;

    if (change) {
      this._commit(documentId, version, change, function(err, serverVersion, newChange, serverChanges) {
        var msg = ['openDone', serverVersion, serverChanges.map(this.serializeChange)];
        this._send(ws, msg);
        this._broadCastChange(ws, documentId, serverVersion, newChange);
      }.bind(this));
    } else {
      this.store.getChanges(documentId, version,
        function(err, serverVersion, changes) {
          var msg = ['openDone', serverVersion, changes.map(this.serializeChange)];
          this._send(ws, msg);
        }.bind(this)
      );
    }
  };

  /*
    Client wants to commit changes
  */
  this.commit = function(ws, documentId, clientVersion, change) {
    this._commit(documentId, clientVersion, change, function(err, serverVersion, newChange, serverChanges) {
      this._broadCastChange(ws, documentId, serverVersion, newChange);
      // confirm the new commit, providing the diff since last common version
      var msg = ['commitDone', serverVersion];
      if (serverChanges && serverChanges.length > 0) {
        msg.push(serverChanges.map(this.serializeChange));
      }
      this._send(ws, msg);
    }.bind(this));
  };

  this.updateSelection = function(ws, documentId, clientVersion, change) {
    console.log('updateselection', change);
    // TODO: rebase change if needed
    this._broadCastChange(ws, documentId, clientVersion, change);
  };

  this._commit = function(documentId, clientVersion, change, cb) {
    // Get latest doc version
    this.store.getVersion(documentId, function(err, headVersion) {
      if (headVersion === clientVersion) { // Fast forward update
        this.store.addChange(documentId, this.serializeChange(change), function(err, newVersion) {
          cb(null, newVersion, change);
        }.bind(this));
      } else { // Client changes need to be rebased to headVersion
        this.store.getChanges(documentId, clientVersion,
          function(err, serverVersion, changes) {
            var B = changes.map(this.deserializeChange);
            var a = this.deserializeChange(change);
            // transform changes
            DocumentChange.transformInplace(a, B);
            // apply the new change
            this.store.addChange(documentId, this.serializeChange(a),
              function(err, newVersion) {
               cb(null, newVersion, a, B);
              }.bind(this)
            );

          }.bind(this)
        );
      }
    }.bind(this));
  };

  this._broadCastChange = function(ws, documentId, newVersion, newChange) {
    // Send changes to all *other* clients
    var collaboratorSockets = this.getCollaboratorSockets(ws, documentId);
    forEach(collaboratorSockets, function(socket) {
      var msg = ['update', newVersion, this.serializeChange(newChange)];
      socket.send(this.serializeMessage(msg));
    }.bind(this));
  };

  this._send = function(ws, msg) {
    ws.send(this.serializeMessage(msg));
  };

  this.serializeMessage = function(msg) {
    return JSON.stringify(msg);
  };

  this.deserializeMessage = function(msg) {
    return JSON.parse(msg);
  };

  this.serializeChange = CollabSession.prototype.serializeChange;

  this.deserializeChange = CollabSession.prototype.deserializeChange;
};

EventEmitter.extend(CollabHub);

module.exports = CollabHub;
