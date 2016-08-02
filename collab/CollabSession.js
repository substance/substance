'use strict';

var debounce = require('lodash/debounce');
var forEach = require('lodash/forEach');
var clone = require('lodash/clone');
var cloneDeep = require('lodash/cloneDeep');
var Err = require('../util/SubstanceError');
var DocumentSession = require('../model/DocumentSession');
var DocumentChange = require('../model/DocumentChange');
var Selection = require('../model/Selection');

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

  this.version = config.version;
  this.documentId = config.documentId || config.docId;

  if (config.autoSync !== undefined) {
    this.autoSync = config.autoSync;
  } else {
    this.autoSync = true;
  }

  if (!this.documentId) {
    throw new Err('InvalidArgumentsError', {message: 'documentId is mandatory'});
  }

  if (typeof this.version === undefined) {
    throw new Err('InvalidArgumentsError', {message: 'version is mandatory'});
  }

  // Internal state
  this._connected = false; // gets flipped to true in syncDone
  this._nextChange = null; // next change to be sent over the wire
  this._pendingChange = null; // change that is currently being synced
  this._error = null;

  // Note: registering a second document:changed handler where we trigger sync requests
  this.doc.on('document:changed', this.afterDocumentChange, this, {priority: -10});

  // Bind handlers
  this._broadCastSelectionUpdateDebounced = debounce(this._broadCastSelectionUpdate, 250);

  // Keep track of collaborators in a session
  this.collaborators = {};

  // This happens on a reconnect
  this.collabClient.on('connected', this.onCollabClientConnected, this);
  this.collabClient.on('disconnected', this.onCollabClientDisconnected, this);

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
    When selection is changed explicitly by the user we broadcast
    that update to other collaborators
  */
  this.setSelection = function(sel) {
    // We just remember beforeSel on the CollabSession (need for connect use-case)
    var beforeSel = this.selection;
    _super.setSelection.call(this, sel);
    this._broadCastSelectionUpdateDebounced(beforeSel, sel);
  };

  this.getCollaborators = function() {
    return this.collaborators;
  };

  this.isConnected = function() {
    return this._connected;
  };


  this.serializeChange = function(change) {
    return change.toJSON();
  };

  this.deserializeChange = function(serializedChange) {
    return DocumentChange.fromJSON(serializedChange);
  };

  /* Message handlers
     ================ */

  /*
    Dispatching of remote messages.
  */
  this._onMessage = function(msg) {
    // Skip if message is not addressing this document
    if (msg.documentId !== this.documentId) {
      return false;
    }
    // clone the msg to make sure that the original does not get altered
    msg = cloneDeep(msg);
    switch (msg.type) {
      case 'syncDone':
        this.syncDone(msg);
        break;
      case 'syncError':
        this.syncError(msg);
        break;
      case 'update':
        this.update(msg);
        break;
      case 'disconnectDone':
        this.disconnectDone(msg);
        break;
      case 'error':
        this.error(msg);
        break;
      default:
        console.error('CollabSession: unsupported message', msg.type, msg);
        return false;
    }
    return true;
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
    Apply remote update

    We receive an update from the server. We only apply the remote change if
    there's no pending commit. applyRemoteUpdate is also called for selection
    updates.

    If we are currently in the middle of a sync or have local changes we just
    ignore the update. We will receive all server updates on the next syncDone.
  */
  this.update = function(args) {
    // console.log('CollabSession.update(): received remote update', args);
    var serverChange = args.change;
    var collaborators = args.collaborators;
    var serverVersion = args.version;

    if (!this._nextChange && !this._pendingChange) {
      var oldSelection = this.selection;
      if (serverChange) {
        serverChange = this.deserializeChange(serverChange);
        this._applyRemoteChange(serverChange);
      }
      var newSelection = this.selection;
      if (serverVersion) {
        this.version = serverVersion;
      }
      var update = {
        change: serverChange
      };
      if (newSelection !== oldSelection) {
        update.selection = newSelection;
      }
      // collaboratorsChange only contains information about
      // changed collaborators
      var collaboratorsChange = this._updateCollaborators(collaborators);
      if (collaboratorsChange) {
        update.collaborators = collaboratorsChange;
        this.emit('collaborators:changed');
      }
      this._triggerUpdateEvent(update, { remote: true });
    } else {
      // console.log('skipped remote update. Pending sync or local changes.');
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
    var collaboratorsChange = this._updateCollaborators(collaborators);
    if (this._nextChange) {
      this._transformCollaboratorSelections(this._nextChange);
    }

    // Important: after sync is done we need to reset _pendingChange and _error
    // In this state we can safely listen to
    this._pendingChange = null;
    this._error = null;

    // Each time the sync worked we consider the system connected
    this._connected = true;

    var update = {
      change: serverChange
    };
    if (collaboratorsChange) {
      update.collaborators = collaboratorsChange;
    }
    this._triggerUpdateEvent(update, { remote: true });

    this.emit('connected');
    // Attempt to sync again (maybe we have new local changes)
    this._requestSync();
  };

  /*
    Handle sync error
  */
  this.syncError = function(error) {
    error('Sync error:', error);
    this._abortSync();
  };

  this.disconnectDone = function() {
    // console.log('disconnect done');
    // Let the server know we no longer want to edit this document
    this._afterDisconnected();
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
      error('CollabSession: unsupported error', error.name);
      return false;
    }

    this.emit('error', err);
    errorFn = errorFn.bind(this);
    errorFn(err);
  };


  /* Event handlers
     ============== */

  this.afterDocumentChange = function(change, info) {
    // Record local changes into nextCommit
    if (!info.remote) {
      this._recordChange(change);
    }
  };

  /*
    A new authenticated collabClient connection is available.

    This happens in a reconnect scenario.
  */
  this.onCollabClientConnected = function() {
    // console.log('CollabClient connected');
    if (this.autoSync) {
      this.sync();
    }
  };

  /*
    Implicit disconnect (server connection drop out)
  */
  this.onCollabClientDisconnected = function() {
    // console.log('CollabClient disconnected');
    this._abortSync();
    if (this._connected) {
      this._afterDisconnected();
    }
  };

  /* Internal methods
     ================ */

  this._commit = function(change, info) {
    var selectionHasChanged = this._commitChange(change);

    var collaboratorsChange = null;
    forEach(this.getCollaborators(), function(collaborator) {
      // transform local version of collaborator selection
      var id = collaborator.collaboratorId;
      var oldSelection = collaborator.selection;
      var newSelection = DocumentChange.transformSelection(oldSelection, change);
      if (oldSelection !== newSelection) {
        collaboratorsChange = collaboratorsChange || {};
        collaborator = clone(collaborator);
        collaborator.selection = newSelection;
        collaboratorsChange[id] = collaborator;
      }
    });

    var update = {
      change: change
    };
    if (selectionHasChanged) {
      update.selection = this.selection;
    }
    if (collaboratorsChange) {
      update.collaborators = collaboratorsChange;
    }
    this._triggerUpdateEvent(update, info);
  };

  /*
    Apply a change to the document
  */
  this._applyRemoteChange = function(change) {
    // console.log('CollabSession: applying remote change');
    if (change.ops.length > 0) {
      this.stage._apply(change);
      this.doc._apply(change);
      // Only undo+redo history is updated according to the new change
      this._transformLocalChangeHistory(change);
      this.selection = this._transformSelection(change);
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

  this.__canSync = function() {
    return this.collabClient.isConnected() && !this._pendingChange;
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

  this._transformCollaboratorSelections = function(change) {
    // console.log('Transforming selection...', this.__id__);
    // Transform the selection
    var collaborators = this.getCollaborators();
    if (collaborators) {
      forEach(collaborators, function(collaborator) {
        DocumentChange.transformSelection(collaborator.selection, change);
      });
    }
  };

  this._updateCollaborators = function(collaborators) {
    var collaboratorsChange = {};

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
          collaboratorsChange[collaboratorId] = collaborator;
        }
      } else {
        collaboratorsChange[collaboratorId] = null;
        delete this.collaborators[collaboratorId];
      }
    }.bind(this));

    if (Object.keys(collaboratorsChange).length>0) {
      return collaboratorsChange;
    }
  };

  /*
    Sets the correct state after a collab session has been disconnected
    either explicitly or triggered by a connection drop out.
  */
  this._afterDisconnected = function() {
    var oldCollaborators = this.collaborators;
    this.collaborators = {};
    var collaboratorIds = Object.keys(oldCollaborators);
    if (collaboratorIds.length > 0) {
      var collaboratorsChange = {};
      // when this user disconnects we will need to remove all rendered collaborator infos (such as selection)
      collaboratorIds.forEach(function(collaboratorId) {
        collaboratorsChange[collaboratorId] = null;
      });
      this._triggerUpdateEvent({
        collaborators: collaboratorsChange
      });
    }
    this._connected = false;
    this.emit('disconnected');
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
