"use strict";

var extend = require('lodash/extend');
var each = require('lodash/each');
var oo = require('../util/oo');
var EventEmitter = require('../util/EventEmitter');
var TransactionDocument = require('./TransactionDocument');
var DefaultChangeCompressor = require('./DefaultChangeCompressor');
var Selection = require('./Selection');
var DocumentChange = require('./DocumentChange');

var __id__ = 0;

/*
  TODO: Maybe find a suitable name.
  The purpose of this class is to maintain editing related things:
    - selection
    - transactions
    - undo/redo
    - versioning
    - collaborative editing
*/
function DocumentSession(doc, options) {
  DocumentSession.super.apply(this);

  this.__id__ = __id__++;
  // local sessionId, overwritten by CollabSession
  this.sessionId = __id__;

  options = options || {};
  this.doc = doc;
  this.selection = Selection.nullSelection;

  // the stage is a essentially a clone of this document
  // used to apply a sequence of document operations
  // without touching this document
  this.stage = new TransactionDocument(this.doc, this);
  this.isTransacting = false;

  this.doneChanges = [];
  this.undoneChanges = [];
  this._lastChange = null;

  this.compressor = options.compressor || new DefaultChangeCompressor();

  // Note: registering twice:
  // 1. once to do internal transformations in case changes are coming
  // in from another session -- this must be done as early as possible
  // 2. to trigger events, such as selection:changed -- this must
  // be done rather late, so that other listeners such as renderers
  // have finished their job already.
  this.doc.on('document:changed', this.onDocumentChange, this, {priority: 1000});
  this.doc.on('document:changed', this.afterDocumentChange, this, {priority: -10});
}

DocumentSession.Prototype = function() {

  this.getDocument = function() {
    return this.doc;
  };

  this.getSelection = function() {
    return this.selection;
  };

  this.setSelection = function(sel) {
    this.selection = sel;
    this.emit('selection:changed', sel, this);
    // For those who are just interested in selection changes
    // done via this method -- as opposed to implicit changes
    // via DocumentChange
    this.emit('selection:changed:explicitly', sel, this);
  };

  this.getCollaborators = function() {
    return null;
  };

  this.canUndo = function() {
    return this.doneChanges.length > 0;
  };

  this.canRedo = function() {
    return this.undoneChanges.length > 0;
  };

  this.undo = function() {
    var change = this.doneChanges.pop();
    if (change) {
      this.stage._apply(change);
      this.doc._apply(change);
      var oldSel = this.selection;
      var sel = change.after.selection;
      if (sel) {
        sel.attach(this.doc);
        this.selection = sel;
      }
      this.undoneChanges.push(change.invert());
      this._notifyChangeListeners(change, { 'replay': true });
      if (!oldSel.equals(this.selection)) {
        this.emit('selection:changed', this.selection, this);
      }
    } else {
      console.error('No change can be undone.');
    }
  };

  this.redo = function() {
    var change = this.undoneChanges.pop();
    if (change) {
      this.stage._apply(change);
      this.doc._apply(change);
      var oldSel = this.selection;
      var sel = change.after.selection;
      if (sel) {
        sel.attach(this.doc);
        this.selection = sel;
      }
      this.doneChanges.push(change.invert());
      this._notifyChangeListeners(change, { 'replay': true });
      if (oldSel !== this.selection) {
        this.emit('selection:changed', this.selection, this);
      }
    } else {
      console.error('No change can be redone.');
    }
  };

  /**
    Start a transaction to manipulate the document

    @param {function} transformation a function(tx) that performs actions on the transaction document tx

    @example

    ```js
    doc.transaction(function(tx, args) {
      tx.update(...);
      ...
      return {
        selection: newSelection
      };
    })
    ```
  */
  this.transaction = function(transformation, info) {
    /* jshint unused: false */
    if (this.isTransacting) {
      throw new Error('Nested transactions are not supported.');
    }
    this.isTransacting = true;
    this.stage.reset();
    var sel = this.selection;
    info = info || {};
    var surfaceId = sel.surfaceId;
    var change = this.stage._transaction(function(tx) {
      tx.before.selection = sel;
      var args = { selection: sel };
      var result = transformation(tx, args) || {};
      sel = result.selection || sel;
      if (sel._isSelection && !sel.isNull() && !sel.surfaceId) {
        sel.surfaceId = surfaceId;
      }
      tx.after.selection = sel;
      extend(info, tx.info);
    });
    if (change) {
      if (change.after.selection._isSelection) {
        this.selection = change.after.selection;
        // HACK injecting the surfaceId here...
        // TODO: we should find out where the best place is to do this
        if (this.selection && !this.selection.isNull() && change.after.surfaceId) {
          this.selection.surfaceId = change.after.surfaceId;
        }
        this._selectionHasChanged = true;
      }
      this.isTransacting = false;
      this._commit(change, info);
      return change;
    } else {
      this.isTransacting = false;
    }
  };

  this.onDocumentChange = function(change, info) {
    // if (info.replay && change.session === this) {
    //   var selection = change.after.selection;
    //   if (selection) {
    //     this.selection = selection;
    //     this._selectionHasChanged = true;
    //   }
    // }
    // ATTENTION: this is used if you have two independent DocumentSessions
    // in one client.
    if (info.session !== this) {
      this.stage._apply(change);
      this._transformLocalChangeHistory(change, info);
      this._transformSelection(change, info);
    }
  };

  this._transformLocalChangeHistory = function(externalChange) {
    // Transform the change history
    // Note: using a clone as the transform is done inplace
    // which is ok for the changes in the undo history, but not
    // for the external change
    var clone = {
      ops: externalChange.ops.map(function(op) { return op.clone(); })
    };
    DocumentChange.transformInplace(clone, this.doneChanges);
    DocumentChange.transformInplace(clone, this.undoneChanges);
  };

  this._transformSelection = function(change) {
    // console.log('Transforming selection...', this.__id__);
    // Transform the selection
    this._selectionHasChanged =
      DocumentChange.transformSelection(this.selection, change);
  };

  this._transformCollaboratorSelections = function(change) {
    // console.log('Transforming selection...', this.__id__);
    // Transform the selection
    var collaborators = this.getCollaborators();
    if (collaborators) {
      each(collaborators, function(collaborator) {
        DocumentChange.transformSelection(collaborator.selection, change);
      });
    }
  };

  this.afterDocumentChange = function() {
    if (this._selectionHasChanged) {
      // console.log('selection has changed', this.__id__);
      this._selectionHasChanged = false;
      this.emit('selection:changed', this.selection, this);
    }
  };

  this._commit = function(change, info) {
    change.sessionId = this.sessionId;
    change.timestamp = Date.now();

    // TODO: try to find a more explicit way, or a maybe a smarter way
    // to keep the TransactionDocument in sync
    this.doc._apply(change);

    // transform local version collaborator selections
    var collaborators = this.getCollaborators();
    if (collaborators) {
      each(collaborators, function(collaborator) {
        DocumentChange.transformSelection(collaborator.selection, change);
      });
    }

    var currentChange = this._currentChange;
    // try to merge this change with the last to get more natural changes
    // e.g. not every keystroke, but typed words or such.
    var merged = false;
    if (currentChange) {
      if (this.compressor.shouldMerge(currentChange, change)) {
        merged = this.compressor.merge(currentChange, change);
      }
    }
    if (!merged) {
      // push to undo queue and wipe the redo queue
      this._currentChange = change;
      this.doneChanges.push(change.invert());
    }
    this.undoneChanges = [];
    // console.log('Document._saveTransaction took %s ms', (Date.now() - time));
    // time = Date.now();
    this._notifyChangeListeners(change, info);
  };

  this._notifyChangeListeners = function(change, info) {
    info = info || {};
    // TODO: iron this out... we should have change.sessionId already
    info.session = this;
    // TODO: I would like to wrap this with a try catch.
    // however, debugging gets inconvenient as caught exceptions don't trigger a breakpoint
    // by default, and other libraries such as jquery throw noisily.
    this.doc._notifyChangeListeners(change, info);
  };

};

oo.inherit(DocumentSession, EventEmitter);

module.exports = DocumentSession;
