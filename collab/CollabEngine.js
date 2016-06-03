"use strict";

var EventEmitter = require('../util/EventEmitter');
var forEach = require('lodash/forEach');
var map = require('lodash/map');
var extend = require('lodash/extend');
var DocumentChange = require('../model/DocumentChange');
var Selection = require('../model/Selection');
var Err = require('../util/SubstanceError');

/*
  Engine for realizing collaborative editing. Implements the server-methods of
  the real time editing as a reusable library.
*/
function CollabEngine(documentEngine) {
  CollabEngine.super.apply(this);

  this.documentEngine = documentEngine;

  // Active collaborators
  this._collaborators = {};
}

CollabEngine.Prototype = function() {

  /*
    Register collaborator for a given documentId
  */
  this._register = function(collaboratorId, documentId, selection, collaboratorInfo) {
    var collaborator = this._collaborators[collaboratorId];

    if (!collaborator) {
      collaborator = this._collaborators[collaboratorId] = {
        collaboratorId: collaboratorId,
        documents: {}
      };
    }

    // Extend with collaboratorInfo if available
    collaborator.info = collaboratorInfo;

    // Register document
    collaborator.documents[documentId] = {
      selection: selection
    };
  };

  /*
    Unregister collaborator id from document
  */
  this._unregister = function(collaboratorId, documentId) {
    var collaborator = this._collaborators[collaboratorId];
    delete collaborator.documents[documentId];
    var docCount = Object.keys(collaborator.documents).length;
    // If there is no doc left, we can remove the entire collaborator entry
    if (docCount === 0) {
      delete this._collaborators[collaboratorId];
    }
  };

  this._updateSelection = function(collaboratorId, documentId, sel) {
    var docEntry = this._collaborators[collaboratorId].documents[documentId];
    docEntry.selection = sel;
  };

  /*
    Get list of active documents for a given collaboratorId
  */
  this.getDocumentIds = function(collaboratorId) {
    var collaborator = this._collaborators[collaboratorId];
    if (!collaborator) {
      // console.log('CollabEngine.getDocumentIds', collaboratorId, 'not found');
      // console.log('CollabEngine._collaborators', this._collaborators);
      return [];
    }
    return Object.keys(collaborator.documents);
  };

  /*
    Get collaborators for a specific document
  */
  this.getCollaborators = function(documentId, collaboratorId) {
    var collaborators = {};
    forEach(this._collaborators, function(collab) {
      var doc = collab.documents[documentId];
      if (doc && collab.collaboratorId !== collaboratorId) {
        var entry = {
          selection: doc.selection,
          collaboratorId: collab.collaboratorId
        };
        entry = extend({}, collab.info, entry);
        collaborators[collab.collaboratorId] = entry;
      }
    });
    return collaborators;
  };

  /*
    Get only collaborator ids for a specific document
  */
  this.getCollaboratorIds = function(documentId, collaboratorId) {
    var collaborators = this.getCollaborators(documentId, collaboratorId);
    return map(collaborators, function(c) {
      return c.collaboratorId;
    });
  };

  /*
    Client starts a sync

    @param args.documentId
    @param args.version The client's document version (0 if client starts with an empty doc)
    @param args.change pending client change

    Note: a client can reconnect having a pending change
    which is similar to the commit case
  */
  this.sync = function(args, cb) {
    // We now always get a change since the selection should be considered
    this._sync(args, function(err, result) {
      if (err) return cb(err);
      // Registers the collaborator If not already registered for that document
      this._register(args.collaboratorId, args.documentId, result.change.after.selection, args.collaboratorInfo);
      cb(null, result);
    }.bind(this));
  };

  /*
    Internal implementation of sync

    @param {String} args.collaboratorId collaboratorId
    @param {String} args.documentId document id
    @param {Number} args.version client version
    @param {Number} args.change new change

    OUT: version, changes, version
  */
  this._sync = function(args, cb) {
    // Get latest doc version
    this.documentEngine.getVersion(args.documentId, function(err, serverVersion) {
      if (serverVersion === args.version) { // Fast forward update
        this._syncFF(args, cb);
      } else if (serverVersion > args.version) { // Client changes need to be rebased to latest serverVersion
        this._syncRB(args, cb);
      } else {
        cb(new Err('InvalidVersionError', {
          message: 'Client version greater than server version'
        }));
      }
    }.bind(this));
  };

  /*
    Update all collaborators selections of a document according to a given change

    WARNING: This has not been tested quite well
  */
  this._updateCollaboratorSelections = function(documentId, change) {
    // By not providing the 2nd argument to getCollaborators the change
    // creator is also included.
    var collaborators = this.getCollaborators(documentId);

    forEach(collaborators, function(collaborator) {
      if (collaborator.selection) {
        var sel = Selection.fromJSON(collaborator.selection);
        change = this.deserializeChange(change);
        sel = DocumentChange.transformSelection(sel, change);
        // Write back the transformed selection to the server state
        this._updateSelection(collaborator.collaboratorId, documentId, sel.toJSON());
      }
    }.bind(this));
  };

  /*
    Fast forward sync (client version = server version)
  */
  this._syncFF = function(args, cb) {
    this._updateCollaboratorSelections(args.documentId, args.change);

    // HACK: On connect we may receive a nop that only has selection data.
    // We don't want to store such changes.
    // TODO: it would be nice if we could handle this in a different
    // branch of connect, so we don't spoil the commit implementation
    if (args.change.ops.length === 0) {
      return cb(null, {
        change: args.change,
        // changes: [],
        serverChange: null,
        version: args.version
      });
    }

    // Store the commit
    this.documentEngine.addChange({
      documentId: args.documentId,
      change: args.change,
      documentInfo: args.documentInfo
    }, function(err, serverVersion) {
      if (err) return cb(err);
      cb(null, {
        change: args.change, // collaborators must be notified
        serverChange: null,
        // changes: [], // no changes missed in fast-forward scenario
        version: serverVersion
      });
    });
  };

  /*
    Rebased sync (client version < server version)
  */
  this._syncRB = function(args, cb) {
    this._rebaseChange({
      documentId: args.documentId,
      change: args.change,
      version: args.version
    }, function(err, rebased) {
      // result has change, changes, version (serverversion)
      if (err) return cb(err);

      this._updateCollaboratorSelections(args.documentId, rebased.change);

      // HACK: On connect we may receive a nop that only has selection data.
      // We don't want to store such changes.
      // TODO: it would be nice if we could handle this in a different
      // branch of connect, so we don't spoil the commit implementation
      if (args.change.ops.length === 0) {
        return cb(null, {
          change: rebased.change,
          serverChange: rebased.serverChange,
          version: rebased.version
        });
      }

      // Store the rebased commit
      this.documentEngine.addChange({
        documentId: args.documentId,
        change: rebased.change, // rebased change
        documentInfo: args.documentInfo
      }, function(err, serverVersion) {
        if (err) return cb(err);
        cb(null, {
          change: rebased.change,
          serverChange: rebased.serverChange, // collaborators must be notified
          version: serverVersion
        });
      });
    }.bind(this));
  };

  /*
    Rebase change

    IN: documentId, change, version (change version)
    OUT: change, changes (server changes), version (server version)
  */
  this._rebaseChange = function(args, cb) {
    this.documentEngine.getChanges({
      documentId: args.documentId,
      sinceVersion: args.version
    }, function(err, result) {
      var B = result.changes.map(this.deserializeChange);
      var a = this.deserializeChange(args.change);
      // transform changes
      DocumentChange.transformInplace(a, B);
      var ops = B.reduce(function(ops, change) {
        return ops.concat(change.ops);
      }, []);
      var serverChange = new DocumentChange(ops, {}, {});

      cb(null, {
        change: this.serializeChange(a),
        serverChange: this.serializeChange(serverChange),
        version: result.version
      });
    }.bind(this));
  };

  /*
    Collaborator leaves a document editing session

    NOTE: This method is synchronous
  */
  this.disconnect = function(args) {
    this._unregister(args.collaboratorId, args.documentId);
  };

  /*
    To JSON
  */
  this.serializeChange = function(change) {
    return change.toJSON();
  };

  /*
    From JSON
  */
  this.deserializeChange = function(serializedChange) {
    var ch = DocumentChange.fromJSON(serializedChange);
    return ch;
  };

};

EventEmitter.extend(CollabEngine);

module.exports = CollabEngine;
