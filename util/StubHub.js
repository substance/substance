"use strict";

var EventEmitter = require('./EventEmitter');
var forEach = require('lodash/forEach');
var DocumentChange = require('../model/DocumentChange');
var CollabSession = require('../model/CollabSession');

/*
  Hub implementation for local testing

  A typical communication flow between client and hub could look like this:

    -> ['open', 'doc1']
    <- ['open:confirmed']
    -> ['commit', [c1,c2,c3], 25]
    <- ['commit:confirmed']
    <- ['update', [c4,c5], 26]
    -> ['close', 'doc1']

  @example

  ```js
  var hub = new StubHub(doc, messageQueue);

  var docSession1 = new CollabSession(doc, messageQueue);
  var docSession2 = new CollabSession(doc, messageQueue);
  ```
*/

function StubHub(wss, store) {
  StubHub.super.apply(this);

  this.wss = wss;

  // where docs (change history is stored)
  this.store = store;

  this._connections = {};
  this.wss.on('connection', this._onConnection, this);
}

StubHub.Prototype = function() {

  this.dispose = function() {
    this.wss.off(this);
  };

  /*
    For a given web socket get all other websockets (aka collaborators)

    collaborator(docId): client !== ws && ws.documentId === documentId
  */
  this.getCollaboratorSockets = function(ws, documentId) {
    var collabs = [];
    forEach(this.wss.clients, function(client) {
      if (client !== ws && ws.documentId === documentId) {
        collabs.push(client);
      }
    });
    return collabs;
  };

  /*
    When a new collaborator connects

    Note: No data is exchanged yet.
  */
  this._onConnection = function(sws) {
    // TODO: there is no way to disconnect a client
    var clientId = sws.clientId;
    console.log('a new collaborator arrived', clientId);
    var connection = {
      clientId: clientId,
      socket: sws,
      onMessage: this._onMessage.bind(this, sws)
    };
    if (this._connections[clientId]) {
      throw new Error('Client is already connected.');
    }
    this._connections[clientId] =  connection;
    sws.on('message', connection.onMessage);
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
    // We store the documentId on the socket instance. That way we know at which
    // document a client is looking at. ATM we support only one active doc editing
    // session per client.
    ws.documentId = documentId;
    // TODO: this needs to be ironed out

    if (change) {
      this.commit(ws, change, version);
      // TODO: client should receive an openDone message too
    } else {
      this.store.getChanges(documentId, version, function(err, changes, headVersion) {
        changes = changes.map(this.serializeChange);
        var msg = ['openDone', headVersion, changes];
        ws.send(this.serializeMessage(msg));
      }.bind(this));
    }
  };

  /*
    Client wants to commit changes
  */
  this.commit = function(ws, documentId, clientVersion, change) {
    var collaboratorSockets;
    // Get latest doc version
    this.store.getVersion(documentId, function(err, headVersion) {
      if (headVersion === clientVersion) { // Fast forward update
        this.store.addChange(documentId, this.serializeChange(change), function(err, newVersion) {
          // send confirmation to client that commited
          var msg = ['commitDone', newVersion];
          ws.send(this.serializeMessage(msg));
          // Send changes to all other clients
          collaboratorSockets = this.getCollaboratorSockets(ws, documentId);
          forEach(collaboratorSockets, function(socket) {
            var msg = ['update', newVersion, this.serializeChange(change)];
            socket.send(this.serializeMessage(msg));
          }.bind(this));
        }.bind(this));
      } else { // Client changes need to be rebased to headVersion
        this.store.getChanges(documentId, clientVersion, function(err, changes) {
          // create clones of the changes for transformation
          changes = changes.map(function(change) {
            return this.deserializeChange(change);
          }.bind(this));
          var newChange = this.deserializeChange(change);
          // transform changes
          for (var i = 0; i < changes.length; i++) {
            DocumentChange.transformInplace(changes[i], newChange);
          }
          // apply the new change
          this.store.addChange(documentId, this.serializeChange(newChange), function(err, headVersion) {
            // update the other collaborators with the new change
            collaboratorSockets = this.getCollaboratorSockets(ws);
            forEach(collaboratorSockets, function(socket) {
              var msg = ['update', headVersion, this.serializeChange(newChange)];
              socket.send(this.serializeMessage(msg));
            }.bind(this));
            // confirm the new commit, providing the diff since last common version
            var msg = ['commitDone', headVersion, changes.map(function(change) {
              return this.serializeChange(change);
            }.bind(this))];
            ws.send(this.serializeMessage(msg));
          });

        }.bind(this));
      }
    }.bind(this));
  };

  this.serializeMessage = function(msg) {
    return msg;
  };

  this.deserializeMessage = function(msg) {
    return msg;
  };

  this.serializeChange = CollabSession.prototype.serializeChange;

  this.deserializeChange = CollabSession.prototype.deserializeChange;
};

EventEmitter.extend(StubHub);

module.exports = StubHub;
