'use strict';

var forEach = require('lodash/forEach');
var DocumentSession = require('../model/DocumentSession');
var DocumentChange = require('../model/DocumentChange');
var debounce = require('lodash/debounce');
var Selection = require('../model/Selection');
var Err = require('../util/Error');

/*
  Session that is connected to a Substance Hub allowing
  collaboration in real-time.

  Requires a connected and authenticated collabClient.
*/
function CollabSession(doc, config) {
  CollabSession.super.call(this, doc, config);

  config = config || {};

  this.collabClient = config.collabClient;

  if (config.docVersion) {
    console.warn('config.docVersion is deprecated: Use config.version instead');
  }

  if (config.docVersion) {
    console.warn('config.docId is deprecated: Use config.documentId instead');
  }

  this.version = config.version || config.docVersion;
  this.documentId = config.documentId || config.docId;

  if (!this.documentId) {
    throw new Err('InvalidArgumentsError', {message: 'documentId is mandatory'});
  }

  if (!this.version) {
    throw new Err('InvalidArgumentsError', {message: 'version is mandatory'});
  }

  // Internal state
  this._connected = false; // becomes true as soon as the initial connect has been completed
  this._nextCommit = null; //
  this._pendingCommit = null;
  this._error = null;

  // Bind handlers
  this._broadCastSelectionUpdateDebounced = debounce(this._broadCastSelectionUpdate, 250);

  // Keep track of collaborators in a session
  this.collaborators = {};

  // This happens on a reconnect
  this.collabClient.on('connected', this._onConnected, this);
  this.collabClient.on('disconnected', this._onDisconnected, this);

  // Constraints used for computing color indexes
  this.__maxColors = 5;
  this.__nextColorIndex = 0;
  this.collabClient.on('message', this._onMessage.bind(this));

  // Attempt to open a document immediately, but only if the collabClient is
  // already connected. If not the _onConnected handler will take care of it
  // once websocket connection is ready.
  if (this.collabClient.isConnected()) {
    this.connect();  
  }
}

CollabSession.Prototype = function() {

  var _super = Object.getPrototypeOf(this);

  /*
    A new authenticated collabClient connection is available.

    This happens in a reconnect scenario.
  */
  this._onConnected = function() {
    console.log('CollabSession.connected');
    this._connected = false;
    this.connect();
  };

  this._onDisconnected = function() {
    console.log('CollabSession network disconnected');
    // We remove all collaborators
    this.collaborators = {};
    this.emit('collaborators:changed');
    this._connected = false;
  };

  /*
    Dispatching of remote messages.
  */
  this._onMessage = function(msg) {
    // TODO: Only consider messages with the right documentId
    if (!((msg.documentId === this.documentId) || (msg.type === 'error' && msg.requestMessage.documentId === this.documentId))) {
      console.info('Message is not addressed for this document. Skipping', msg.documentId);
      return;
    }

    // console.log('MESSAGE RECEIVED', msg);

    var changes, change;
    switch(msg.type) {
      case 'error':
        this.error(msg);
        break;
      case 'connectDone':
      case 'commitDone':
        if (msg.changes) {
          changes = msg.changes.map(function(change) {
            return this.deserializeChange(change);
          }.bind(this));
        }
        this[msg.type](msg.version, changes, msg.collaborators);
        break;
      case 'collaboratorDisconnected':
        this.collaboratorDisconnected(msg.collaboratorId);
        break;
      case 'update':
        change = this.deserializeChange(msg.change);
        // msg.collaborator is optional (it's included when updates comes from a new collaborator)
        this.applyRemoteUpdate(msg.version, change, msg.collaboratorId, msg.collaborator);
        break;
      default:
        console.error('CollabSession: unsupported message', msg.type, msg);
    }
  };

  /*
    If there's an unconfirmed pending commit it will be merged with nextCommit

    This is needed in a disconnect/reconnect scenario, where we assume the
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
    see a response (enterDone) for it. E.g. when the connection is not
    authenticated. However in such cases we will receive a connected event
    and then open gets called again, considering the pendingCommit
    (see _computeNextCommit).

    @param {WebSocket} ws a connected websocket.
  */
  this.connect = function() {
    this._connected = false;
    var msg = {
      type: 'connect',
      documentId: this.documentId,
      version: this.version
    };

    // Makes sure an eventual pendingCommit gets considered in the nextCommit.
    this._computeNextCommit();

    if (this._nextCommit) {
      // This behaves like a commit
      msg.change = this.serializeChange(this._nextCommit);
      this._send(msg);
      // In case of a reconnect we need to set _connected back to false
      this._afterCommit(this._nextCommit);
    } else {
      // Attach a change that only has the selection
      var selUpdateChange = this._getChangeForSelection(this.selection, this.selection);
      msg.change = this.serializeChange(selUpdateChange);
      this._send(msg);
    }
  };

  /*
    Handle errors. This gets called if any request produced
    an error on the server. The error object holds te original
    message we could inspect in a custom error handler to trigger
    certain behavior.
  */
  this.error = function(error) {
    console.error('An error occured', error);
    this._error = error;
    this.emit('error,', error);
    this._computeNextCommit();
    this._pendingCommit = null;
  };

  // Needed in the case of a reconnect or explicit close
  this.dispose = function() {
    // Reset to original state
    this.stop();
    this._error = null;
    this._connected = false;
    this._nextCommit = null;
    this._pendingCommit = null;
  };

  /*
    TODO: Make use of it.
  */
  this.disconnect = function() {
    // Let the server know we no longer want to edit this document
    var msg = {
      type: 'disconnect',
      documentId: this.documentId
    };
    this._send(msg);
    // And now dispose and deregister the handlers
    this.dispose();
  };

  /*
    Send local changes to upstream.
  */
  this.commit = function() {
    // If there is something to commit and there is no commit pending
    if (this.collabClient.isConnected() && this._nextCommit && !this._pendingCommit) {
      var msg = {
        type: 'commit',
        documentId: this.documentId,
        version: this.version,
        change: this.serializeChange(this._nextCommit)
      };
      this._send(msg);
      this._afterCommit(this._nextCommit);
    }
  };

  /*
    Try to commit changes to the server every 1s
  */
  this.startAutoCommit = function() {
    // ATTENTION: don't start multiple runners
    this._autoCommit = true;
    // if (!this._runner) {
    //   this._runner = setInterval(this.commit.bind(this), 1000);
    // }
  };

  /*
    Stop auto-committing changes
  */
  this.stopAutoCommit = function() {
    this._autoCommit = false;
    // if (this._runner) {
    //   clearInterval(this._runner);
    //   this._runner = null;
    // }
  };

  this._requestCommit = function() {
    if (this._autoCommit) {
      this.commit();
    } else {
      console.log('nextCommit ready. call this.commit() to send it.');
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

    this._requestCommit();
  };

  /*
    Set internal state for committing
  */
  this._afterCommit = function(change) {
    this._pendingCommit = change;
    this._nextCommit = null;
    this._error = null;
  };

  /*
    When selection is changed explicitly by the user we broadcast
    that update to other collaborators
  */
  this.setSelection = function(sel) {
    // We just remember beforeSel on the CollabSession (need for connect use-case)
    var beforeSel = this.selection;
    _super.setSelection.call(this, sel);
    this._broadCastSelectionUpdateDebounced(beforeSel, sel);
  };

  /*
    Takes beforeSel + afterSel and wraps it in a no-op DocumentChange
  */
  this._getChangeForSelection = function(beforeSel, afterSel) {
    var change = new DocumentChange([], {
      selection: beforeSel
    }, {
      selection: afterSel
    });
    return change;
  };

  /*
    Send selection update to other collaborators
  */
  this._broadCastSelectionUpdate = function(beforeSel, afterSel) {
    if (!this._nextCommit && !this._pendingCommit) {
      var change = this._getChangeForSelection(beforeSel, afterSel);
      var msg = {
        type: 'updateSelection',
        documentId: this.documentId,
        version: this.version,
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
  this._applyRemoteChange = function(change/*, collaboratorId, collaborator*/) {
    this.stage._apply(change);
    this.doc._apply(change);

    // QUESTION: will this manipulate the change?
    this._transformLocalChangeHistory(change);
    this._transformSelections(change);

    // We need to notify the change listeners so the UI gets updated
    // We pass replay: false, so this does not become part of the undo
    // history.
    this._notifyChangeListeners(change, { replay: false, remote: true });
    return change;
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
  this.connectDone = function(serverVersion, changes, collaborators) {
    console.log('Received connectDone', serverVersion, changes);
    if (this.version !== serverVersion) {
      // There have been changes on the server since the doc was opened
      // the last time
      if (changes) {
        // console.log('Applying remote changes...');
        changes.forEach(function(change) {
          this._applyRemoteChange(change);
          // No additional selection updates needed
        }.bind(this));
      }
    }
    this.version = serverVersion;

    // Initialize collaborators
    this.collaborators = {};
    forEach(collaborators, function(collaborator) {
      this._addCollaborator(collaborator);
    }.bind(this));
    this.emit('collaborators:changed');
    this._connected = true;

    // Important: after connect done we need to reset _pendingCommit
    this._pendingCommit = null;
    this._error = null;

    // Not recommended to use this event
    // this.emit('connected');

    // Now we start to record local changes and periodically push them to remove
    this.startAutoCommit();
  };

  this.isConnected = function() {
    return this._connected;
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
    this.version = version;
    this._pendingCommit = null;

    // Attempt to send new commit for remaining changes
    this._requestCommit();
    // console.log('commit confirmed by server. New version:', version);
  };

  /*
    Update collaborator based on data sent with a remote update
  */
  this._updateCollaborator = function(collaboratorId, change, newCollaborator) {
    var collaborator = this.collaborators[collaboratorId];
    if (collaborator) {
      collaborator.selection = change.after.selection;
      // this.emit('collaborators:changed');
    } else {
      if (newCollaborator) {
        console.log('collaborator connected', collaboratorId);
        this._addCollaborator(newCollaborator);
        // this.emit('collaborators:changed');
      } else {
        console.log('collaboratorId not found in collabSession.');
      }
    }
  };

  this._addCollaborator = function(collaborator) {
    this.collaborators[collaborator.collaboratorId] = collaborator;
    if (collaborator.selection) {
      collaborator.selection = Selection.fromJSON(collaborator.selection);
    }
    collaborator.colorIndex = this._getNextColorIndex();
  };

  /*
    We receive an update from the server. We only apply the remote change if
    there's no pending commit. applyRemoteUpdate is also called for selection
    updates.

    TODO: it may happen that we receive selection changes while we are in a pending
    commit state.

    IMPORTANT: never set collaborator states before _applyRemoteChange has been performed
    as this would transform them again
  */
  this.applyRemoteUpdate = function(version, change, collaboratorId, newCollaborator) {

    // We only accept updates if there are no pending commitable changes
    // Not sure this check is correct.
    if (!this._nextCommit && !this._pendingCommit) {
      
      if (change.ops.length > 0) {
        this._applyRemoteChange(change);  
      }

      // Register new collaborator if needed
      // It's important this happens after this._applyRemoteChange as it must
      // not be transformed
      if (newCollaborator) {
        console.log('collaborator connected', collaboratorId);
        this._addCollaborator(newCollaborator);
      } else {
        // Update existing collaborator entry
        var collaborator = this.collaborators[collaboratorId];
        if (collaborator) {
          collaborator.selection = change.after.selection;
        } else {
          console.log('collaborator not found', collaboratorId);
        }
      }
      // This is fired in addition to the document:changed event
      // so possibly we have 2 rerenders here.
      this.emit('collaborators:changed');

      this.version = version;
    } else {
      console.log("EDGECASE: received an update but can't apply as there is a pendingCommit in the air");
    }
  };

  this.serializeChange = function(change) {
    return change.toJSON();
  };

  this.deserializeChange = function(serializedChange) {
    return DocumentChange.fromJSON(serializedChange);
  };

  this._send = function(msg) {
    if (this.collabClient.isConnected()) {
      this.collabClient.send(msg);
    } else {
      console.warn('Try not to call _send when disconnected. Skipping message', msg);
    }
  };

  /*
    Get color index for rendering cursors and selections in round robin style.
    Note: This implementation considers a configured maxColors value. The
    first color will be reused as more then maxColors collaborators arrive.
  */
  this._getNextColorIndex = function() {
    var colorIndex = this.__nextColorIndex;
    this.__nextColorIndex = (this.__nextColorIndex + 1) % this.__maxColors;
    return colorIndex + 1; // so we can 1..5 instead of 0..4
  };
};

DocumentSession.extend(CollabSession);

module.exports = CollabSession;
