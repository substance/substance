"use strict";

var EventEmitter = require('../util/EventEmitter');
var forEach = require('lodash/forEach');
var DocumentChange = require('../model/DocumentChange');
var uuid = require('../util/uuid');

/*
  Hub for realizing collaborative editing. Implements the server-end of the
  protocol.

  @class

  @param {WebsocketServer} wss a websocket server instance
  @param {Store} a substance changes store instance

  A typical communication flow between client and hub looks like this:

    -> open doc-1
    <- openDone
    -> commit c1,c2,c3 version: 25
    <- commitDone
    <- update c4,c5 version version 27
    -> close doc-1

  @example

  ```js
  var hub = new CollabHub(wss, store);
  hub.addRoutes(expressApp)
  ```
*/

function CollabHub(wss, store) {
  CollabHub.super.apply(this);

  this.wss = wss;

  // Where docs, users and sessions are stored
  this.store = store;
  this._onConnection = this._onConnection.bind(this);
  this.wss.on('connection', this._onConnection);
  this._connections = new WeakMap();
}

CollabHub.Prototype = function() {

  /*
    Add http routes to the given Express app. 

    This must be called explicitly for now.
  */
  this.addRoutes = function(app) {
    var store = this.store;

    app.post('/hub/api/authenticate', function(req, res, next) {
      console.log('POST: /hub/api/authenticate');
      var loginData = req.body;
      store.authenticate(loginData, function(err, session) {
        if(err) return next(err);
        res.json(session);
      });
    });

    app.post('/hub/api/signup', function(req, res, next) {
      console.log('POST: /hub/api/signup');
      var userData = req.body;
      store.createUser(userData, function(err, result) {
        if(err) return next(err);
        res.json(result);
      });
    });
  
    app.get('/hub/api/snapshot/:id', function(req, res, next) {
      store.getSnapshot(req.params.id, function(err, doc, version) {
        if(err) return next(err);
        res.json([doc, version]);
      });
    });

    app.post('/hub/api/upload', store.getFileUploader('files'), function(req, res) {
      res.json({name: store.getFileName(req)});
    });
  };

  /*
    When a new collaborator connects

    Note: No data is exchanged yet.
  */
  this._onConnection = function(ws) {
    var connection = {
      // open documents of a connection, as there can be
      // multiple doc editing sessions at the same time
      documents: {},
      collaboratorId: uuid(),
      userSession: null
    };
    this._connections.set(ws, connection);

    ws.on('message', this._onMessage.bind(this, ws));
    ws.on('close', this._onWebSocketClose.bind(this, ws));
  };

  this._onWebSocketClose = function(ws) {
    this._resetConnection(ws);
  };

  /*
    If user gets disconnected or goes into unauthenticated state we need to 
    disable currently edited documents
  */
  this._resetConnection = function(ws) {
    var conn = this._connections.get(ws);
    forEach(conn.documents, function(document, documentId) {
      this._broadcastCollaboratorDisconnected(ws, documentId, conn.collaboratorId);
    }.bind(this));
  };

  this.dispose = function() {
    this.wss.off(this);
  };

  /*
    For a given web socket get all other websockets for a document (aka collaborators)
    
    collaborator(docId): client !== ws && ws.documentId === documentId
  */
  this.getCollaboratorSockets = function(ws, documentId) {
    var sockets = [];
    forEach(this.wss.clients, function(client) {
      var conn = this._connections.get(client);
      if (conn.documents[documentId] && ws !== client) {
        sockets.push(client);
      }
    }.bind(this));
    return sockets;
  };

  /*
    Get collaborators for a specific document
  */
  this.getCollaborators = function(ws, documentId) {
    var collaborators = {};

    forEach(this.wss.clients, function(client) {
      var conn = this._connections.get(client);
      var doc = conn.documents[documentId];
      if (doc && ws !== client) {
        collaborators[conn.collaboratorId] = {
          user: conn.userSession.user,
          selection: doc.selection,
          collaboratorId: conn.collaboratorId
        };
      }
    }.bind(this));
    return collaborators;
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

    // We need a fast and reliable way to retrieve sessions
    // Maybe we want to have an in-memory cash of all active sessions,
    // so we don't need to hit the database all the time.
    this.store.getSession(msg.sessionToken, function(err, userSession) {
      // TODO: we should send back some message to the client that there is no valid session
      if (err) {
        console.error('Connection is not authenticated. Ignoring message... ', msg);
        var errorMsg = {
          scope: 'hub',
          type: 'sessionInvalid'
        };
        // Let hubClient know that session became invalid
        this._send(ws, undefined, errorMsg);
        this._resetConnection(ws);
        return;
      }

      var change;
      switch(msg.type) {
        case 'open':
        case 'commit':
          if (msg.change) {
            change = this.deserializeChange(msg.change);
          }
          this[msg.type](ws, userSession, msg.documentId, msg.version, change);
          break;
        case 'updateSelection':
          if (msg.change) {
            change = this.deserializeChange(msg.change);
          }
          this.updateSelection(ws, userSession, msg.documentId, msg.version, change);
          break;
        default:
          console.error('CollabHub: unsupported message', msg.type, msg);
      }
    }.bind(this));
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
  this.open = function(ws, userSession, documentId, clientVersion, change) {
    var conn = this._connections.get(ws);
    var self = this;

    if (conn.documents[documentId]) {
      console.error('Connection is already registered for document', documentId);
    }

    // Get other connected collaborators for document
    var collaborators = this.getCollaborators(ws, documentId);
    
    // Update connection state
    conn.documents[documentId] = {
      selection: null
    };
    conn.userSession = userSession;
    
    function _commitOrGetChanges(cb) {
      if (change) {
        self._commit(documentId, clientVersion, change, function(err, serverVersion, newChange, serverChanges) {
          cb(serverVersion, newChange, serverChanges.map(self.serializeChange));
        });
      } else {
        self.store.getChanges(documentId, clientVersion, function(err, serverVersion, changes) {
          cb(serverVersion, null, changes);
        });
      }
    }

    _commitOrGetChanges(function(serverVersion, newChange, changes) {
      if (newChange) {
        var broadcastChangeMsg = {
          type: 'update',
          version: serverVersion,
          change: newChange,
          collaboratorId: conn.collaboratorId
        };
        self._broadCast(ws, documentId, broadcastChangeMsg);
      }

      // Confirm openDone
      var msg = {
        type: 'openDone',
        version: serverVersion,
        changes: changes,
        collaborators: collaborators
      };
      self._send(ws, documentId, msg);

      // Broadcast arrival of new collaborator
      self._broadcastCollaboratorConnected(ws, documentId, userSession.user, conn.collaboratorId);
    });
  };

  this._broadcastCollaboratorConnected = function(ws, documentId, user, collaboratorId) {
    var collaborator = {
      user: user,
      selection: null,
      collaboratorId: collaboratorId
    };
    var msg = {
      type: 'collaboratorConnected',
      collaborator: collaborator
    };
    this._broadCast(ws, documentId, msg);
  };

  this._broadcastCollaboratorDisconnected = function(ws, documentId, collaboratorId) {
    var msg = {
      type: 'collaboratorDisconnected',
      collaboratorId: collaboratorId
    };
    this._broadCast(ws, documentId, msg);
  };

  /*
    Client sends selection update
  */
  this.updateSelection = function(ws, userSession, documentId, clientVersion, newChange) {
    var self = this;

    function _transformChange(cb) {
      self.store.getVersion(documentId, function(err, serverVersion) {
        if (serverVersion === clientVersion) return cb(newChange);
        self._rebaseChange(documentId, clientVersion, newChange, function(err, rebasedNewChange) {
          cb(rebasedNewChange);
        });
      });
    }

    _transformChange(function(transformedChange) {
      var conn = self._connections.get(ws);
      // Update the connection state to reflect the new selection
      conn.documents[documentId].selection = transformedChange.after.selection;

      var msg = {
        type: 'updateSelection',
        version: clientVersion,
        change: self.serializeChange(transformedChange),
        userId: userSession.user.userId,
        collaboratorId: conn.collaboratorId
      };
      self._broadCast(ws, documentId, msg);
    });
  };

  /*
    Client wants to commit changes
  */
  this.commit = function(ws, userSession, documentId, clientVersion, change) {
    var conn = this._connections.get(ws);
    this._commit(documentId, clientVersion, change, function(err, serverVersion, newChange, serverChanges) {
      // Broadcast change to collaborators
      var broadcastMsg = {
        type: 'update',
        version: serverVersion,
        change: newChange,
        collaboratorId: conn.collaboratorId
      };
      this._broadCast(ws, documentId, broadcastMsg);

      // confirm the new commit, providing the diff since last common version
      var msg = {
        type: 'commitDone',
        version: serverVersion
      };
      if (serverChanges && serverChanges.length > 0) {
        msg.changes = serverChanges.map(this.serializeChange);
      }
      this._send(ws, documentId, msg);
    }.bind(this));
  };

  this._rebaseChange = function (documentId, clientVersion, change, cb) {
    this.store.getChanges(documentId, clientVersion,
      function(err, serverVersion, changes) {
        var B = changes.map(this.deserializeChange);
        var a = this.deserializeChange(change);
        // transform changes
        DocumentChange.transformInplace(a, B);
        // apply the new change
        cb(null, a, B);
      }.bind(this)
    );
  };

  this._commit = function(documentId, clientVersion, newChange, cb) {
    // Get latest doc version
    this.store.getVersion(documentId, function(err, serverVersion) {
      if (serverVersion === clientVersion) { // Fast forward update
        this.store.addChange(documentId, this.serializeChange(newChange), function(err, newVersion) {
          cb(null, newVersion, newChange, []);
        }.bind(this));
      } else { // Client changes need to be rebased to latest serverVersion
        this._rebaseChange(documentId, clientVersion, newChange, function(err, rebasedNewChange, rebasedOtherChanges) {
          this.store.addChange(documentId, this.serializeChange(rebasedNewChange), function(err, newVersion) {
            cb(null, newVersion, rebasedNewChange, rebasedOtherChanges);
          }.bind(this));
        }.bind(this));
      }
    }.bind(this));
  };

  this._broadCast = function(ws, documentId, msg) {
    msg.scope = 'hub';
    msg.documentId = documentId;
    var collaboratorSockets = this.getCollaboratorSockets(ws, documentId);
    forEach(collaboratorSockets, function(socket) {
      socket.send(this.serializeMessage(msg));
    }.bind(this));
  };

  this._send = function(ws, documentId, msg) {
    msg.scope = 'hub';
    msg.documentId = documentId;
    ws.send(this.serializeMessage(msg));
  };

  this.serializeMessage = function(msg) {
    return JSON.stringify(msg);
  };

  this.deserializeMessage = function(msg) {
    return JSON.parse(msg);
  };

  // to stringified JSON
  this.serializeChange = function(change) {
    return change.toJSON();
  };

  this.deserializeChange = function(serializedChange) {
    return DocumentChange.fromJSON(serializedChange);
  };
};

EventEmitter.extend(CollabHub);

module.exports = CollabHub;
