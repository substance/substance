'use strict';

// var isString = require('lodash/isString');
var forEach = require('lodash/forEach');
var DocumentSession = require('../model/DocumentSession');
var DocumentChange = require('../model/DocumentChange');
var debounce = require('lodash/debounce');
var Selection = require('../model/Selection');

/*
  Session that is connected to a Substance Hub allowing
  collaboration in real-time.

  Assumes a running and authenticated hubClient connection.
*/
function CollabSession(doc, config) {
  CollabSession.super.call(this, doc, config);

  config = config || {};

  this.hubClient = config.hubClient;

  // TODO: The CollabSession or the doc needs to be aware of a doc id
  // that corresponds to the doc on the server. For now we just
  // store it on the document instance.
  this.doc.id = config.docId;

  // TODO: Also we need to somehow store a version number (local version)
  this.doc.version = config.docVersion;

  // Internal state
  this._opened = false; // becomes true as soon as the initial open has been completd
  this._nextCommit = null; // 
  this._pendingCommit = null;

  // Bind handlers
  this._broadCastSelectionUpdateDebounced = debounce(this._broadCastSelectionUpdate, 250);

  // Keep track of collaborators in a session
  this.collaborators = {};

  // This happens on a reconnect
  this.hubClient.on('connection', this._onHubClientConnected, this);


  // DISABLED: We handle all authentication / logout scenarios on app level for now
  // -------------------
  // 
  // this.hubClient.on('authenticate', this._onHubClientAuthenticated, this);
  // this.hubClient.on('disconnect', this._onHubClientDisconnected, this);
  // We treat unauthenticate like disconnect, as the collabsession requires
  // an authenticated session
  // this.hubClient.on('unauthenticate', this._onHubClientUnauthenticated, this);

  this.hubClient.on('message', this._onMessage.bind(this));

  // Attempt to open a document immediately
  if (this.hubClient.isAuthenticated()) {
    this.open();  
  } else {
    console.warn('Attempted to create a CollabSession using an unauthenticated hubClient');
  }
  
}

CollabSession.Prototype = function() {

  var _super = Object.getPrototypeOf(this);

  /*
    A new authenticated hubClient connection is available.

    This happens in a reconnect scenario. We just
  */
  this._onHubClientConnected = function() {
    console.log('hub client reconnected to a new websocket. We reopen the doc.');
    this._opened = false;
    this.open();
  };

  // this._onHubClientAuthenticated = function() {
  //   console.log('hub client authenticated');
  //   this._opened = false;
  //   this.open();
  // };
  
  // this._onHubClientUnauthenticated = function() {
  //   console.log('hub client unauthenticated.');
  //   this._opened = false;
  //   // this._onHubClientDisconnected();
  // };

  /*
    Hub Client got disconnected. E.g. when the session became invalid.
  */
  // this._onHubClientDisconnected = function() {
  //   console.log('hub client disconnected');
  //   this._opened = false;
  //   // this._computeNextCommit();
  // };

  /*
    Dispatching of remote messages.
  */
  this._onMessage = function(msg) {
    // TODO: Only consider messages with the right documentId
    if (msg.documentId !== this.doc.id) {
      console.info('No documentId provided with message');
    }

    // console.log('MESSAGE RECEIVED', msg);

    var changes, change;
    switch(msg.type) {
      case 'openDone':
      case 'commitDone':
        if (msg.changes) {
          changes = msg.changes.map(function(change) {
            return this.deserializeChange(change);
          }.bind(this));
        }
        this[msg.type](msg.version, changes, msg.collaborators);
        break;
      case 'collaboratorConnected':
        this.collaboratorConnected(msg.collaborator);
        break;
      case 'collaboratorDisconnected':
        this.collaboratorDisconnected(msg.collaboratorId);
        break;
      case 'update':
        change = this.deserializeChange(msg.change);
        this.applyRemoteChange(msg.version, change, msg.collaboratorId);
        break;
      case 'updateSelection':
        change = this.deserializeChange(msg.change);
        this.applyRemoteSelection(msg.version, change, msg.collaboratorId);
        break;
      default:
        console.error('CollabSession: unsupported message', msg.type, msg);
    }
  };

  /*
    If there's an unconfirmed pending commit it will be merged with nextCommit

    This is needed in a disconnect/reconnect scenario. Where we know the
    pendingCommit will never be confirmed.
  */
  this._computeNextCommit = function() {
    var newNextCommit = this._nextCommit;

    if (this._pendingCommit) {
      newNextCommit = this._pendingCommit;
      this._pendingCommit = null;
      if (this._nextCommit) {
        newNextCommit.ops = newNextCommit.ops.concat(this._nextCommit.ops);
        newNextCommit.after = this._nextCommit.after;        
      }
    }
    this._nextCommit = newNextCommit;
    return newNextCommit;
  };

  /*
    Connect session with remote endpoint and loads the upstream changes.
    
    This operation initializes an editing session. It may happen that we never
    see a response (openDone) for it. E.g. when the connection is not
    authenticated. However in such cases we will receive a connected event
    and then open gets called again, considering the pendingCommit
    (see _computeNextCommit).

    @param {WebSocket} ws a connected websocket.
  */
  this.open = function() {
    this._opened = false;
    var msg = {
      type: 'open',
      documentId: this.doc.id,
      version: this.doc.version
    };

    // Makes sure an eventual pendingCommit gets considered in the nextCommit.
    this._computeNextCommit();

    if (this._nextCommit) {
      // This behaves like a commit
      msg.change = this.serializeChange(this._nextCommit);
      this._send(msg);
      // In case of a reconnect we need to set _opened back to false
      this._afterCommit(this._nextCommit);
    } else {
      this._send(msg);
    }
  };

  // Needed in the case of a reconnect or explicit close
  this.dispose = function() {
    // Reset to original state
    this._opened = false;
    this._nextCommit = null;
    this._pendingCommit = null;
  };

  /*
    TODO: Make use of it.
  */
  this.close = function() {
    // Let the server know we no longer want to edit this document
    var msg = {
      type: 'close',
      documentId: this.doc.id,
      version: this.doc.version
    };
    this._send(msg);
    // And now dispose and deregister the handlers
    this.dispose();
  };

  /*
    Send local changes to the world.
  */
  this.commit = function() {
    // If there is something to commit and there is no commit pending
    if (this.hubClient.isConnected() && this._nextCommit && !this._pendingCommit) {
      console.log('committing', this._nextCommit);
      var msg = {
        type: 'commit', 
        documentId: this.doc.id,
        version: this.doc.version,
        change: this.serializeChange(this._nextCommit)
      };
      this._send(msg);
      this._afterCommit(this._nextCommit);
    }
  };

  this.start = function() {
    this._runner = setInterval(this.commit.bind(this), 1000);
  };

  this.stop = function() {
    // Try to commit changes to the server every 1s
    if (this._runner) {
      clearInterval(this._runner);
      this._runner = null;
    }
  };

  /*
    We record all local changes into a single change (aka commit) that
  */
  this._recordCommit = function(change) {
    if (!this._nextCommit) {
      this._nextCommit = change;
    } else {
      // Merge new change into nextCommit
      this._nextCommit.ops = this._nextCommit.ops.concat(change.ops);
      this._nextCommit.after = change.after;
    }
  };

  /*
    Set internal state for committing
  */
  this._afterCommit = function(change) {
    this._pendingCommit = change;
    this._nextCommit = null;
  };

  /*
    When selection is changed explicitly by the user we broadcast
    that update to other collaborators
  */
  this.setSelection = function(sel) {
    var beforeSel = this.selection;
    _super.setSelection.call(this, sel);
    this._broadCastSelectionUpdateDebounced(beforeSel, sel);
  };

  /*
    Send selection update to other collaborators
  */
  this._broadCastSelectionUpdate = function(beforeSel, afterSel) {
    if (!this._nextCommit && !this._pendingCommit) {
      var change = new DocumentChange([], {
        selection: beforeSel
      }, {
        selection: afterSel
      });

      var msg = {
        type: 'updateSelection',
        documentId: this.doc.id,
        version: this.doc.version,
        change: this.serializeChange(change)
      };
      this._send(msg);
    }
  };

  this.afterDocumentChange = function(change, info) {
    _super.afterDocumentChange.apply(this, arguments);

    // Record local changes into nextCommit
    if (!info.remote) {
      this._recordCommit(change);
    }
  };

  /*
    Apply a change to the document
  */
  this._applyRemoteChange = function(change, collaboratorId) {
    // console.log("REMOTE CHANGE", change);
    this.stage._apply(change);
    this.doc._apply(change);
    this._transformLocalChangeHistory(change);
    this._transformSelections(change);

    var collaborator = this.collaborators[collaboratorId];
    if (collaborator) {
      collaborator.selection = change.after.selection;
    }

    // We need to notify the change listeners so the UI gets updated
    // We pass replay: false, so this does not become part of the undo
    // history.
    this._notifyChangeListeners(change, { replay: false, remote: true });
  };

  this._applyRemoteSelection = function(version, change, collaboratorId) {
    var collaborator = this.collaborators[collaboratorId];
    if (collaborator) {
      var sel = change.after.selection;
      if (sel) {
        sel.attach(this.doc);
      }
      // EXPERIMENTAL: needing to rebase the selection
      // when ever there are pending changes
      if (this._pendingCommit) {
        DocumentChange.transformSelection(sel, this._pendingCommit);
      }
      if (this._nextCommit) {
        DocumentChange.transformSelection(sel, this._nextCommit);
      }
      collaborator.selection = sel;
      this.emit('collaborators:changed');
    }
  };

  this.getCollaborators = function() {
    return this.collaborators;
  };

  /*
    Get a session index which is used e.g. for styling user selections.

    Note: this implementation considers that collaborators can disappear,
          thus sessionIndex can be used when a new collaborator
          appears.
  */
  this._getNextSessionIndex = function() {
    if (this.sessionIdPool.length === 0) {
      var collabCount = Object.keys(this.collaborators).length;
      this.sessionIdPool.push(collabCount);
    }
    return this.sessionIdPool.shift();
  };

  /*
    Server has opened the document. The collab session is live from
    now on.
  */
  this.openDone = function(serverVersion, changes, collaborators) {
    if (this.doc.version !== serverVersion) {
      // There have been changes on the server since the doc was opened
      // the last time
      if (changes) {
        changes.forEach(function(change) {
          this._applyRemoteChange(change);
        }.bind(this));
      }
    }
    this.doc.version = serverVersion;

    // Initialize collaborators
    console.log('collaborators after open: ', collaborators);

    this.collaborators = collaborators;
    forEach(this.collaborators, function(collaborator) {
      collaborator.selection = Selection.fromJSON(collaborator.selection);
    });
    this.emit('collaborators:changed');

    console.log('Open complete. Listening for remote changes ...');

    this._opened = true;
    this.emit('opened');
    // Now we start to record local changes and periodically push them to remove
    this.start();
  };

  this.isOpen = function() {
    return this._opened;
  };

  this.collaboratorConnected = function(collaborator) {
    this.collaborators[collaborator.collaboratorId] = collaborator;
    console.log('collaborator connected', this.collaborators);
    this.emit('collaborators:changed');
  };

  this.collaboratorDisconnected = function(collaboratorId) {
    delete this.collaborators[collaboratorId];
    console.log('collaborator disconnected', collaboratorId, this.collaborators);
    this.emit('collaborators:changed');
  };

  /*
    Retrieved when a commit has been confirmed by the server
  */
  this.commitDone = function(version, remoteChanges) {
    if (remoteChanges) {
      remoteChanges.forEach(function(change) {
        this._applyRemoteChange(change);
      }.bind(this));
    }
    this.doc.version = version;
    this._pendingCommit = null;
    console.log('commit confirmed by server. New version:', version);
  };

  /*
    We receive an update from the server
    As a client can only commit one change at a time
    there is also only one update at a time.
  */
  this.applyRemoteChange = function(version, change, userId) {
    if (!this._nextCommit && !this._pendingCommit) {
      // We only accept updates if there are no pending commitable changes
      this._applyRemoteChange(change, userId);
      this.doc.version = version;
    }
  };

  this.applyRemoteSelection = function(version, change, collaboratorId) {
    this._applyRemoteSelection(version, change, collaboratorId);
  };

  this.serializeChange = function(change) {
    return change.toJSON();
  };

  this.deserializeChange = function(serializedChange) {
    return DocumentChange.fromJSON(serializedChange);
  };

  this._send = function(msg) {
    this.hubClient.send(msg);
  };

};

DocumentSession.extend(CollabSession);

module.exports = CollabSession;
