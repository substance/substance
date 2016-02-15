'use strict';

var isString = require('lodash/isString');
var DocumentSession = require('./DocumentSession');
var DocumentChange = require('./DocumentChange');
var uuid = require('../util/uuid');
var debounce = require('lodash/debounce');

/*
  Session that is connected to a Substance Hub allowing
  collaboration in real-time.

  TODO:
    - error handling strategies
      - e.g. a commit message never gets through to the server
         - how to detect those errors? timeout?
         - how to handle them?
           - resend same commit?
           - just include affected changes with the next regular commit?
*/
function CollabSession(doc, options) {
  CollabSession.super.call(this, doc, options);

  options = options || {};

  // TODO: this should be retrieved from the server?
  this.sessionId = uuid();

  // TODO: The CollabSession or the doc needs to be aware of a doc id
  // that corresponds to the doc on the server. For now we just
  // store it on the document instance.
  this.doc.id = options.docId;

  // TODO: Also we need to somehow store a version number (local version)
  this.doc.version = options.docVersion;

  // Internal state
  this._opened = false;
  this.nextCommit = null;
  this._committing = false;
  this._pendingCommit = null;

  // whenever a change of a new collaborator is received
  // we add a record here
  this.collaborators = {};
  this.sessionIdPool = [1,2,3,4,5,6,7,8,9,10];

  // Bind handlers
  this._broadCastSelectionUpdateDebounced = debounce(this._broadCastSelectionUpdate, 250);

  // this._onConnected = this._onConnected.bind(this);
  this._onMessage = this._onMessage.bind(this);
}

CollabSession.Prototype = function() {

  var _super = Object.getPrototypeOf(this);

  /*
    Connect session with remote endpoint and loads the document

    @param {WebSocket} ws a connected websocket.
  */
  this.open = function(ws) {

    if (ws.readyState !== 1) { // 1 == WebSocket.OPEN
      throw new Error('Websocket is not open yet');
    }

    // In the case of a reconnect (first remove the old handlers)
    this.dispose();
    this.ws = ws;
    this.ws.addEventListener('message', this._onMessage);

    var msg = ['open', this.doc.id, this.doc.version];
    if (this.nextCommit) {
      // This behaves like a commit
      msg.push(this.serializeChange(this.nextCommit));
      this._send(msg);
      this._afterCommit(this.nextCommit);
    } else {
      this._send(msg);
    }
  };

  // Needed in the case of a reconnect or explicit close
  this.dispose = function() {
    if (this.ws) {
      this.ws.removeEventListener('message', this._onMessage);  
    }
    // Reset to original state
    this._opened = false;
    this.nextCommit = null;
    this._committing = false;
    this._pendingCommit = null;
  };

  this.close = function() {
    // TODO: send a message to the server that we are no longer
    // editing that document
    this.dispose();
  };

  /*
    Send local changes to the world.
  */
  this.commit = function() {
    // If there is something to commit and there is no commit pending
    if (this.nextCommit && !this._committing) {
      // console.log('committing', this.nextCommit);
      var msg = ['commit', this.doc.id, this.doc.version, this.serializeChange(this.nextCommit)];
      this._send(msg);
      this._afterCommit(this.nextCommit);
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
    if (!this.nextCommit) {
      this.nextCommit = change;
    } else {
      // Merge new change into nextCommit
      this.nextCommit.ops = this.nextCommit.ops.concat(change.ops);
      this.nextCommit.after = change.after;
    }
  };

  // set internal state for committing
  this._afterCommit = function(change) {
    this._pendingCommit = change;
    this.nextCommit = null;
    this._committing = true;
  };

  this.setSelection = function(sel) {
    var beforeSel = this.selection;
    _super.setSelection.call(this, sel);
    this._broadCastSelectionUpdateDebounced(beforeSel, sel);
  };

  this._broadCastSelectionUpdate = function(beforeSel, afterSel) {
    if (!this.nextCommit && !this._committing) {
      var change = new DocumentChange([], {
        selection: beforeSel
      }, {
        selection: afterSel
      });
      change.sessionId = this.sessionId;
      var msg = ['updateSelection', this.doc.id, this.doc.version, this.serializeChange(change)];
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
    Handling of remote messages.

    Message comes in in the following format:

    ['open', 'doc13']

    We turn this into a method call internally:

    this.open(ws, 'doc13')

    The first argument is always the websocket so we can respond to messages
    after some operations have been performed.
  */
  this._onMessage = function(msg) {
    msg = this.deserializeMessage(msg.data);
    var method = msg[0];
    var version, change, changes;
    switch(method) {
      case 'openDone':
      case 'commitDone':
        version = msg[1];
        if (msg[2]) {
          changes = msg[2].map(function(change) {
            return this.deserializeChange(change);
          }.bind(this));
        }
        this[method](version, changes);
        break;
      case 'update':
        version = msg[1];
        change = this.deserializeChange(msg[2]);
        this.applyRemoteChange(version, change);
        break;
      case 'updateSelection':
        version = msg[1];
        change = this.deserializeChange(msg[2]);
        this.applyRemoteSelection(version, change);
        break;
      default:
        console.error('CollabSession: unsupported message', method, msg);
    }
  };

  /*
    Apply a change to the document
  */
  this._applyRemoteChange = function(change) {
    // console.log("REMOTE CHANGE", change);
    this.stage._apply(change);
    this.doc._apply(change);
    this._transformLocalChangeHistory(change);
    this._transformSelections(change);

    var collaborator = this._getCollaborator(change.sessionId);
    if (collaborator) {
      collaborator.selection = change.after.selection;
    }

    // We need to notify the change listeners so the UI gets updated
    // We pass replay: false, so this does not become part of the undo
    // history.
    this._notifyChangeListeners(change, { replay: false, remote: true });
  };

  this._getCollaborator = function(sessionId) {
      var collaborator = this.collaborators[sessionId];
      if (!collaborator) {
        // find user index used for selecting a color
        collaborator = {
          sessionId: sessionId,
          sessionIndex: this._getNextSessionIndex(),
          selection: null
        };
        this.collaborators[sessionId] = collaborator;
      }
      return collaborator;
  };

  this._applyRemoteSelection = function(change) {
    var collaborator = this._getCollaborator(change.sessionId);
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
      if (this.nextCommit) {
        DocumentChange.transformSelection(sel, this.nextCommit);
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

  this._applyChange = function() {
    console.warn('DEPRECATED: use this._applyRemoteChange() instead');
    this._applyRemoteChange.apply(this, arguments);
  };

  /*
    Server has opened the document. The collab session is live from
    now on.
  */
  this.openDone = function(serverVersion, changes) {
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
    console.log(this.ws.clientId, ': Open complete. Listening for remote changes ...');
    this._opened = true;
    this.emit('opened');
    // Now we start to periodically push local changes to remote
    this.start();
  };

  this.isOpen = function() {
    return this._opened;
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
    this._committing = false;
    this._pendingCommit = null;
    console.log(this.ws.clientId, ': commit confirmed by server. New version:', version);
  };

  /*
    We receive an update from the server
    As a client can only commit one change at a time
    there is also only one update at a time.
  */
  this.applyRemoteChange = function(version, change) {
    if (!this.nextCommit && !this._committing) {
      // We only accept updates if there are no pending commitable changes
      this._applyRemoteChange(change);
      this.doc.version = version;
    }
  };

  this.applyRemoteSelection = function(version, change) {
    this._applyRemoteSelection(change);
  };

  this.serializeMessage = function(msg) {
    return JSON.stringify(msg);
  };

  this.deserializeMessage = function(msg) {
    return JSON.parse(msg);
  };

  this.serializeChange = function(change) {
    if (change instanceof DocumentChange) {
      return JSON.stringify(change.toJSON());
    } else {
      throw new Error('FIXME: We want to have serializeChange called on real object only');
    }
  };

  this.deserializeChange = function(data) {
    if (isString(data)) {
      return DocumentChange.fromJSON(JSON.parse(data));
    } else {
      throw new Error('CollabSession.deserializeChange is expecting a string');
    }
  };

  this._send = function(msg) {
    this.ws.send(this.serializeMessage(msg));
  };

};

DocumentSession.extend(CollabSession);

module.exports = CollabSession;
