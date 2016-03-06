"use strict";

var EventEmitter = require('../util/EventEmitter');
var forEach = require('lodash/forEach');
var map = require('lodash/map');
var DocumentChange = require('../model/DocumentChange');

/*
  Engine for realizing collaborative editing. Implements the server-methods of 
  the real time editing as a reusable library.
*/

function CollabEngine(store) {
  CollabEngine.super.apply(this);

  // Where changes are stored
  this.store = store;

  // Active collaborators
  this._collaborators = {};
}

CollabEngine.Prototype = function() {

  /*
    Register collaborator for a given documentId
  */
  this._register = function(collaboratorId, documentId) {
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
      selection: null
    };
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
          selection: collab.selection,
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
    Enter a new collaborative editing session.

    @param args.documentId
    @param args.version The client's document version (0 if client starts with an empty doc)
    @param args.change pending client change

    Note: a client can reconnect having a pending change
    which is similar to the commit case
  */
  this.enter = function(args, cb) {
    this._register(args.collaboratorId, args.documentId);

    if (args.change) {
      // Stores new change and rebases it if needed
      this.commit(args, cb);
    } else {
      // Just get the latest changes
      this.store.getChanges({
        documentId: args.documentId,
        sinceVersion: args.version,
      }, function(err, result) {
        cb(null, {
          changes: result.changes,
          version: result.version
        });
      });
    }
  };

  /*
    Client wants to commit a change

    @param {String} args.collaboratorId collaboratorId
    @param {String} args.documentId document id
    @param {Number} args.version client version
    @param {Number} args.userId collaborator's userId if known
    @param {Number} args.change new change

    OUT: version, changes, version
  */
  this.commit = function(args, cb) {
    // Get latest doc version
    this.store.getVersion(args.documentId, function(err, serverVersion) {
      if (serverVersion === args.version) { // Fast forward update
        this._commitFF(args, cb);
      } else { // Client changes need to be rebased to latest serverVersion
        this._commitRB(args, cb);
      }
    }.bind(this));
  };

  /*
    Fast forward commit (server version = client version)
  */
  this._commitFF = function(args, cb) {
    // Store the commit
    this.store.addChange({
      documentId: args.documentId,
      change: args.change, // rebased change
      userId: args.userId
    }, function(err, serverVersion) {
      if (err) return cb(err);
      cb(null, {
        change: args.change, // collaborators must be notified
        changes: [],
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

      // Store the rebased commit
      this.store.addChange({
        documentId: args.documentId,
        change: rebased.change, // rebased change
        userId: args.userId
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

    IN: documentId, version, change
    OUT: transformed change
  */
  this.transformSelection = function(args, cb) {
    this.store.getVersion(args.documentId, function(err, serverVersion) {
      if (serverVersion === args.version) {
        // Fast-foward: Nothing needs to be transformed
        cb(null, args.change);
      } else {
        this._rebaseChange({
          documentId: args.documentId,
          change: args.change,
          version: args.version
        }, function(err, rebased) {
          if (err) return cb(err);
          cb(null, rebased.change);
        });
      }
    }.bind(this));
  };

  /*
    Rebase change

    IN: documentId, change, version (change version)
    OUT: change, changes (server changes), version (server version)
  */
  this._rebaseChange = function (args, cb) {
    this.store.getChanges({
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
    Collaborator leaves the party
  */
  this.exit = function(args) {
    this._unregister(args.collaboratorId, args.documentId);
  };

  // to stringified JSON
  this.serializeChange = function(change) {
    return change.toJSON();
  };

  // from JSON
  this.deserializeChange = function(serializedChange) {
    var ch = DocumentChange.fromJSON(serializedChange);
    return ch;
  };

};

EventEmitter.extend(CollabEngine);

module.exports = CollabEngine;
