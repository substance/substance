"use strict";

var EventEmitter = require('./EventEmitter');
var forEach = require('lodash/forEach');
var DocumentChange = require('./../model/DocumentChange');

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


function StubHub(doc, wss) {
  StubHub.super.apply(this);

  this.doc = doc;

  // We just assume some doc id + version for the StubHub
  this.doc.id = 'doc-15';
  this.doc.version = 1;
  this.changes = [];
  this.wss = wss;

  this.wss.connect(this, {
    'connection': this._onConnection
  });
}

StubHub.Prototype = function() {
  /*
    For a given web socket get all other websockets (aka collaborators)
  */
  this.getCollaboratorSockets = function(ws) {
    var collabs = [];
    forEach(this.wss.clients, function(client) {
      if (client !== ws) collabs.push(client);
    });
    return collabs;
  };

  /*
    When a new collaborator connects

    Note: No data is exchanged yet.
  */
  this._onConnection = function(ws) {
    console.log('a new collaborator arrived', ws.clientId);
    var self = this;

    ws.connect(this, {
      'message': function(data) {
        self._onMessage(ws, data);
      }
    });
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
  this._onMessage = function(ws, data) {
    var method = data[0];
    var args = data.splice(1);
    args.unshift(ws);
    // Call handler
    this[method].apply(this, args);
  };

  /*
    First thing the client sends to initialize the collaborative editing
    session.

    @param ws
    @param documentId
    @param version The client's document version
    @param change pending client change

    Note: a client can reconnect having a pending change
    which is similar to the commit case
  */
  this.open = function(ws, documentId, version, change) {
    change = this._deserializeChange(change);
    // TODO: this needs to be ironed out
    if (change) {
      this.commit(ws, change, version);
    } else {
      var changes = this.getChangesSinceVersion(version);
      var serverVersion = this.getVersion();
      ws.send(['openDone', serverVersion, changes.map(this._serializeChange.bind(this))]);
    }
  };

  /*
    Get all changes that happened since a particular version

    NOTE: assumes that version 1 = [] and version 2 = [c1]
  */
  this.getChangesSinceVersion = function(version) {
    return this.changes.splice(version-1);
  };

  this.getVersion = function() {
    return this.changes.length + 1;
  };

  /*
    Apply a set of changes to the document

    @returns transformed change after being applied

    TODO: perform transformation here
  */
  this._applyChange = function(change) {
    this.doc._apply(change);
    // Remember change in history.
    this.changes.push(change);
    this.doc.version += 1;
  };

  /*
    Client wants to commit changes
  */
  this.commit = function(ws, change, version) {
    change = this._deserializeChange(change);
    var newVersion, collaboratorSockets;
    if (this.doc.version === version) {
      this._applyChange(change);
      newVersion = this.doc.version;
      // send confirmation to client that commited
      ws.send(['commitDone', newVersion]);
      // Send changes to all other clients
      collaboratorSockets = this.getCollaboratorSockets(ws);
      forEach(collaboratorSockets, function(socket) {
        socket.send(['update', newVersion, this._serializeChange(change)]);
      }.bind(this));
    } else {
      var changes = this.getChangesSinceVersion(this.doc.version);
      // create clones of the changes for transformation
      changes = changes.map(function(change) {
        return change.clone();
      });
      var newChange = change.clone();
      // transform changes
      for (var i = 0; i < changes.length; i++) {
        DocumentChange.transformInplace(changes[i], newChange);
      }
      // apply the new change
      this._applyChange(newChange);
      newVersion = this.doc.version;
      // update the other collaborators with the new change
      collaboratorSockets = this.getCollaboratorSockets(ws);
      forEach(collaboratorSockets, function(socket) {
        socket.send(['update', newVersion, this._serializeChange(newChange)]);
      }.bind(this));
      // confirm the new commit, providing the diff since last common version
      ws.send(['commitDone'], newVersion, changes.map(this._serializeChange.bind(this)));
    }
  };

  this._serializeChange = function(change) {
    if (change) {
      return change.serialize();
    }
  };

  this._deserializeChange = function(changeData) {
    if (changeData) {
      return DocumentChange.deserialize(changeData);
    }
  };

};

EventEmitter.extend(StubHub);

module.exports = StubHub;
