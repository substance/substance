"use strict";

var EventEmitter = require('../util/EventEmitter');
var forEach = require('lodash/forEach');
var map = require('lodash/map');
var DocumentChange = require('../model/DocumentChange');

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
  this._register = function(collaboratorId, documentId, selection) {
    var collaborator = this._collaborators[collaboratorId];

    if (!collaborator) {
      collaborator = this._collaborators[collaboratorId] = {
        collaboratorId: collaboratorId,
        documents: {}
      };
    }

    if (collaborator.documents[documentId]) {
      console.error('ERROR: Collaborator already registered for doc.');
    }

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
    var docCount = Object.keys(collaborator.documents);
    // If there is no doc left, we can remove the entire collaborator entry
    if (docCount === 0) {
      delete this._collaborators[collaboratorId];
    }
  };

  this._updateSelection = function(collaboratorId, documentId, change) {
    var docEntry = this._collaborators[collaboratorId].documents[documentId];
    docEntry.selection = change.after.selection;
  };

  /*
    Get list of active documents for a given collaboratorId
  */
  this.getDocumentIds = function(collaboratorId) {
    var collaborator = this._collaborators[collaboratorId];
    if (!collaborator) {
      console.log('CollabEngine.getDocumentIds', collaboratorId, 'not found');
      console.log('CollabEngine._collaborators', this._collaborators);
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
        collaborators[collab.collaboratorId] = {
          selection: doc.selection,
          collaboratorId: collab.collaboratorId
        };
      }
    }.bind(this));
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
    Connect a new collaborative editing session.

    @param args.documentId
    @param args.version The client's document version (0 if client starts with an empty doc)
    @param args.change pending client change

    Note: a client can reconnect having a pending change
    which is similar to the commit case
  */
  this.connect = function(args, cb) {
    // We now always get a change since the selection should be considered
    this.commit(args, function(err, result) {
      if (err) return cb(err);
      // We wait with registering the collaborator so we can have the correct,
      // transformed selection
      this._register(args.collaboratorId, args.documentId, result.change.after.selection);
      cb(null, result);
    }.bind(this));
  };

  /*
    Client wants to commit a change

    @param {String} args.collaboratorId collaboratorId
    @param {String} args.documentId document id
    @param {Number} args.version client version
    @param {Number} args.change new change

    OUT: version, changes, version
  */
  this.commit = function(args, cb) {
    // Get latest doc version
    this.documentEngine.getVersion(args.documentId, function(err, serverVersion) {
      if (serverVersion === args.version) { // Fast forward update
        this._commitFF(args, cb);
      } else { // Client changes need to be rebased to latest serverVersion
        this._commitRB(args, cb);
      }
    }.bind(this));
  };

  /*
    Fast forward commit (client version = server version)
  */
  this._commitFF = function(args, cb) {
    // HACK: On connect we may receive a nop that only has selection data.
    // We don't want to store such changes.
    // TODO: it would be nice if we could handle this in a different
    // branch of connect, so we don't spoil the commit implementation
    if (args.change.ops.length === 0) {
      console.log('skipped nop change');
      return cb(null, {
        change: args.change,
        changes: [],
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
        changes: [], // no changes missed in fast-forward scenario
        version: serverVersion
      });
    }.bind(this));
  };

  /*
    Rebased commit (client version < server version)
  */
  this._commitRB = function(args, cb) {
    this._rebaseChange({
      documentId: args.documentId,
      change: args.change,
      version: args.version
    }, function(err, rebased) {
      // result has change, changes, version (serverversion)
      if (err) return cb(err);

      // HACK: On connect we may receive a nop that only has selection data.
      // We don't want to store such changes.
      // TODO: it would be nice if we could handle this in a different
      // branch of connect, so we don't spoil the commit implementation
      if (args.change.ops.length === 0) {
        console.log('skipped nop change');
        return cb(null, {
          change: rebased.change,
          changes: rebased.changes,
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
          changes: rebased.changes, // collaborators must be notified
          version: serverVersion
        });
      }.bind(this));
    }.bind(this));
  };

  /*
    Transforms an incoming selection update if needed. Selection updates
    are realized as changes that don't get stored in the database.

    IN: collaboratorId, documentId, version, change
    OUT: transformed change
  */
  this.updateSelection = function(args, cb) {
    this.documentEngine.getVersion(args.documentId, function(err, serverVersion) {
      if (serverVersion === args.version) {
        // Fast-foward: Nothing needs to be transformed
        this._updateSelection(args.collaboratorId, args.documentId, args.change);
        cb(null, {
          version: serverVersion,
          change: args.change
        });
      } else {
        this._rebaseChange({
          documentId: args.documentId,
          change: args.change,
          version: args.version
        }, function(err, rebased) {
          if (err) return cb(err);
          this._updateSelection(args.collaboratorId, args.documentId, rebased.change);
          cb(null, {
            version: serverVersion,
            change: rebased.change
          });
        }.bind(this));
      }
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
      cb(null, {
        change: this.serializeChange(a),
        changes: B.map(this.serializeChange),
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
