"use strict";

var EventEmitter = require('./EventEmitter');
var WebSocketServer = require('./WebSocketServer');
var forEach = require('lodash/forEach');

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

function StubHub(doc, messageQueue) {
  StubHub.super.apply(this);

  this.doc = doc;
  this.messageQueue = messageQueue;
  this.wss = new WebSocketServer(messageQueue);

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
    console.log('a new collaborator arrived');
    var self = this;

    ws.connect(this, {
      'message': function(data) {
        self._onMessage(ws, data);
      }
    });
  };

  /*
    Handling of remote messages. 

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

    TODO: in future we need to load a doc's changeset from the db and
    verify the revision
  */
  this.open = function(ws, documentId, rev) {
    ws.send(['open:finsihed', rev]);

    // TODO: check revision of document from client with server-side revision
    // If client version is older send diff to client
    // sends back new server revision + needed changes to bring the client to the latest version
    // ws.send(['open:finished', rev, changeset]);
  };

  /*
    Client wants to commit changes
  */
  this.commit = function(ws, changeset, rev) {
    // TODO: make this a real check
    if (this.doc.rev === rev || true) {
      forEach(changeset, function(change) {
        this.doc._apply(change);
      }.bind(this));
      // send confirmation to client that commited
      ws.send('commit:confirmed', rev);
    } else {
      // TODO: Make use of DocumentChange.transform()
      throw new Error('client and server have different versions: server side rebase needed!');
    }
  };
};

EventEmitter.extend(StubHub);

module.exports = StubHub;
