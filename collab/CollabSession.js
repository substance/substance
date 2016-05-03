'use strict';

var forEach = require('lodash/forEach');
var DocumentSession = require('../model/DocumentSession');
var DocumentChange = require('../model/DocumentChange');
var debounce = require('lodash/debounce');
var cloneDeep = require('lodash/cloneDeep');
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
  this.config = config;
  this.collabClient = config.collabClient;

  if (config.docVersion) {
    console.warn('config.docVersion is deprecated: Use config.version instead');
  }

  if (config.docVersion) {
    console.warn('config.docId is deprecated: Use config.documentId instead');
  }

  this.version = config.version || config.docVersion;
  this.documentId = config.documentId || config.docId;

  if (config.autoSync !== undefined) {
    this.autoSync = config.autoSync;
  } else {
    this.autoSync = true;
  }

  if (!this.documentId) {
    throw new Err('InvalidArgumentsError', {message: 'documentId is mandatory'});
  }

  if (!this.version) {
    throw new Err('InvalidArgumentsError', {message: 'version is mandatory'});
  }

  // Internal state
  this._connected = false; // gets flipped to true in syncDone
  this._nextChange = null; // next change to be sent over the wire
  this._pendingChange = null; // change that is currently being synced
  this._error = null;

  // Bind handlers
  this._broadCastSelectionUpdateDebounced = debounce(this._broadCastSelectionUpdate, 250);

  // Keep track of collaborators in a session
  this.collaborators = {};

  // This happens on a reconnect
  this.collabClient.on('connected', this._onCollabClientConnected, this);
  this.collabClient.on('disconnected', this._onCollabClientDisconnected, this);

  // Constraints used for computing color indexes
  this.__maxColors = 5;
  this.__nextColorIndex = 0;
  this.collabClient.on('message', this._onMessage.bind(this));

  // Attempt to open a document immediately, but only if the collabClient is
  // already connected. If not the _onConnected handler will take care of it
  // once websocket connection is ready.
  if (this.collabClient.isConnected() && this.autoSync) {
    this.sync();
  }
}

CollabSession.Prototype = function() {

  var _super = CollabSession.super.prototype;

  /*
    A new authenticated collabClient connection is available.

    This happens in a reconnect scenario.
  */
  this._onCollabClientConnected = function() {
    console.log('CollabClient connected');
    // Attempt to sync
    if (this.autoSync) {
      this.sync();
    }
  };

  /*
    Implicit disconnect (server connection drop out)
  */
  this._onCollabClientDisconnected = function() {
    console.log('CollabClient disconnected');
    this._abortSync();
    if (this._connected) {
      this._afterDisconnected();  
    }
  };
  
  /*
    Sets the correct state after a collab session has been disconnected
    either explicitly or triggered by a connection drop out.
  */
  this._afterDisconnected = function() {
    // We remove all collaborators
    this.collaborators = {};
    this.emit('collaborators:changed');
    this._connected = false;
    this.emit('disconnected');
  };

  /*
    Dispatching of remote messages.
  */
  this._onMessage = function(msg) {
    // Skip if message is not addressing this document
    if (msg.documentId !== this.documentId) {
      return false;
    }

    // Delegate
    var actionFn = this[msg.type];
    if (!actionFn) {
      console.error('CollabSession: unsupported message', msg.type, msg);
      return false;
    }
    actionFn = actionFn.bind(this);
    actionFn(cloneDeep(msg));
    return true;
  };

  /*
    Handle errors. This gets called if any request produced
    an error on the server.
  */

  this.error = function(message) {
    var error = message.error;
    var errorFn = this[error.name];
    var err = Err.fromJSON(error);
    
    if (!errorFn) {
      console.error('CollabSession: unsupported error', error.name);
      return false;
    }

    this.emit('error', err);
    errorFn = errorFn.bind(this);
    errorFn(err);
  };

  /*
    Handle sync error
  */
  this.syncError = function(error) {
    console.error('sync error occured', error);
    this._abortSync();
  };

  /*
    Unregister event handlers. Call this before throw away
    a CollabSession reference. Otherwise you will leak memory
  */
  this.dispose = function() {
    this.disconnect();
    this.collabClient.off(this);
  };

  /*
    Explicit disconnect initiated by user
  */
  this.disconnect = function() {
    // Let the server know we no longer want to edit this document
    var msg = {
      type: 'disconnect',
      documentId: this.documentId
    };

    // We abort pening syncs
    this._abortSync();
    this._send(msg);
  };

  this.disconnectDone = function() {
    // console.log('disconnect done');
    // Let the server know we no longer want to edit this document
    this._afterDisconnected();
  };

  /*
    Abots the currently running sync.

    This is called _onDisconnect and could be called after a sync request
    times out (not yet implemented)
  */
  this._abortSync = function() {
    var newNextChange = this._nextChange;

    if (this._pendingChange) {
      newNextChange = this._pendingChange;
      // If we have local changes also, we append them to the new nextChange
      if (this._nextChange) {
        newNextChange.ops = newNextChange.ops.concat(this._nextChange.ops);
        newNextChange.after = this._nextChange.after;
      }
      this._pendingChange = null;
    }
    this._error = null;
    this._nextChange = newNextChange;
  };

  /*
    Get next change for sync.

    If there are no local changes we create a change that only
    holds the current selection.
  */
  this._getNextChange = function() {
    var nextChange = this._nextChange;
    if (!nextChange) {
      // Change only holds the current selection
      nextChange = this._getChangeForSelection(this.selection, this.selection);
    }
    return nextChange;
  };

  this.__canSync = function() {
    return this.collabClient.isConnected() && !this._pendingChange;
  };

  /*
    Synchronize with collab server
  */
  this.sync = function() {

    // If there is something to sync and there is no running sync
    if (this.__canSync()) {
      var nextChange = this._getNextChange();
      var msg = {
        type: 'sync',
        documentId: this.documentId,
        version: this.version,
        change: this.serializeChange(nextChange)
      };

      this._send(msg);
      this._pendingChange = nextChange;
      // Can be used to reset errors that arised from previous syncs.
      // When a new sync is started, users can use this event to unset the error
      this.emit('sync');
      this._nextChange = null;
      this._error = null;
    } else {
      console.error('Can not sync. Either collabClient is not connected or we are already syncing');
    }
  };

  /*
    Sync has completed

    We apply server changes that happened in the meanwhile and we update
    the collaborators (=selections etc.)
  */
  this.syncDone = function(args) {
    var serverChange = args.serverChange;
    var collaborators = args.collaborators;
    var serverVersion = args.version;

    if (serverChange) {
      serverChange = this.deserializeChange(serverChange);
      this._applyRemoteChange(serverChange);
    }
    this.version = serverVersion;

    // Only apply updated collaborators if there are no local changes
    // Otherwise they will not be accurate. We can safely skip this
    // here as we know the next sync will be triggered soon. And if
    // followed by an idle phase (_nextChange = null) will give us
    // the latest collaborator records
    var collaboratorsChanged = this._updateCollaborators(collaborators);
    if (this._nextChange) {
      this._transformCollaboratorSelections(this._nextChange);
    }

    // Important: after sync is done we need to reset _pendingChange and _error
    // In this state we can safely listen to 
    this._pendingChange = null;
    this._error = null;

    // Each time the sync worked we consider the system connected
    this._connected = true;

    // TODO: this would trigger too many renders potentially
    // once we have our phases in place we can do this in one go
    if (serverChange && serverChange.ops.length > 0) {
      this._notifyChangeListeners(serverChange, { replay: false, remote: true });  
    }
    if (collaboratorsChanged) {
      this.emit('collaborators:changed');  
    }
    this.emit('connected');

    // Attempt to sync again (maybe we have new local changes)
    this._requestSync();
  };

  /*
    Triggers a new sync if there is a new change and no pending sync
  */
  this._requestSync = function() {
    if (this._nextChange && this.__canSync()) {
      this.sync();
    }
  };

  /*
    We record all local changes into a single change (aka commit) that
  */
  this._recordChange = function(change) {
    if (!this._nextChange) {
      this._nextChange = change;
    } else {
      // Merge new change into nextCommit
      this._nextChange.ops = this._nextChange.ops.concat(change.ops);
      this._nextChange.after = change.after;
    }
    this._requestSync();
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
    Returns true if there are local changes
  */
  this._hasLocalChanges = function() {
    return this._nextChange && this._nextChange.ops.length > 0;
  };

  /*
    Send selection update to other collaborators
  */
  this._broadCastSelectionUpdate = function(beforeSel, afterSel) {
    if (this._nextChange) {
      this._nextChange.after.selection = afterSel;
    } else {
      this._nextChange = this._getChangeForSelection(beforeSel, afterSel);
    }
    this._requestSync();
  };

  this.afterDocumentChange = function(change, info) {
    _super.afterDocumentChange.apply(this, arguments);

    // Record local changes into nextCommit
    if (!info.remote) {
      this._recordChange(change);
    }
  };

  /*
    Apply a change to the document
  */
  this._applyRemoteChange = function(change) {
    this.stage._apply(change);
    this.doc._apply(change);
    // Only undo+redo history is updated according to the new change
    this._transformLocalChangeHistory(change);
    this._transformSelection(change);
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

  this.isConnected = function() {
    return this._connected;
  };

  /*
    IDEA: we could check if anything changes and only then
    emit the collaborators:changed event
    this would solve cases where the user selection gets destroyed
    because of many collaboratorSelection updates
  */
  this._updateCollaborators = function(collaborators) {
    var changed = false;

    forEach(collaborators, function(collaborator, collaboratorId) {
      if (collaborator) {
        var oldSelection;
        var old = this.collaborators[collaboratorId];
        if (old) {
          oldSelection = old.selection;
        }
        var newSelection = Selection.fromJSON(collaborator.selection);
        newSelection.attach(this.doc);

        // Assign colorIndex (try to restore from old record)
        collaborator.colorIndex = old ? old.colorIndex : this._getNextColorIndex();
        collaborator.selection = newSelection;
        this.collaborators[collaboratorId] = collaborator;
        if (!newSelection.equals(oldSelection)) {
          changed = true;
        }
      } else {
        changed = true; // Collaborator left, so we need an update
        delete this.collaborators[collaboratorId];
      }
    }.bind(this));
    return changed;
  };

  /*
    Apply remote update

    We receive an update from the server. We only apply the remote change if
    there's no pending commit. applyRemoteUpdate is also called for selection
    updates.

    If we are currently in the middle of a sync or have local changes we just
    ignore the update. We will receive all server updates on the next syncDone.
  */
  this.update = function(args) {
    var serverChange = args.change;
    var collaborators = args.collaborators;
    var serverVersion = args.version;

    if (!this._nextChange && !this._pendingChange) {
      if (serverChange) {
        serverChange = this.deserializeChange(serverChange);
        this._applyRemoteChange(serverChange);
      }
      if (serverVersion) {
        this.version = serverVersion;
      }
      var collaboratorsChanged = this._updateCollaborators(collaborators);
      if (serverChange) {
        this._notifyChangeListeners(serverChange, { replay: false, remote: true });  
      }
      if (collaboratorsChanged) {
        this.emit('collaborators:changed');  
      }
    } else {
      console.log('skipped remote update. Pending sync or local changes.');
    }
  };

  this.serializeChange = function(change) {
    return change.toJSON();
  };

  this.deserializeChange = function(serializedChange) {
    return DocumentChange.fromJSON(serializedChange);
  };

  /*
    Send message

    Returns true if sent, false if not sent (e.g. when not connected)
  */
  this._send = function(msg) {
    if (this.collabClient.isConnected()) {
      this.collabClient.send(msg);
      return true;
    } else {
      console.warn('Try not to call _send when disconnected. Skipping message', msg);
      return false;
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
