"use strict";

var EventEmitter = require('../util/EventEmitter');
var forEach = require('lodash/forEach');
var map = require('lodash/map');
var DocumentChange = require('../model/DocumentChange');
var uuid = require('../util/uuid');

/*
  Engine for realizing collaborative editing. Implements the server-methods of 
  the real time editing as a reusable library.
*/

function CollabEngine(store) {
  CollabEngine.super.apply(this);

  // Where docs, users and sessions are stored
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
    Start a new collaborative editing session.

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
      this._commit(args, cb);
    } else {
      // Just get the latest changes
      this.store.getChanges(args, cb);
    }
  };

  /*
    Rebase change

    args: documentId, version, change
  */
  this._rebaseChange = function (args, cb) {
    var args = {
      documentId: args.documentId,
      sinceVersion: args.version
    };

    this.store.getChanges(args, function(err, result) {
      var B = changes.map(this.deserializeChange);
      var a = this.deserializeChange(args.change);
      // transform changes
      DocumentChange.transformInplace(a, B);
      cb(null, {
        change: this.serializeChange(a),
        changes: B.map(this.deserializeChange)
      });
    }.bind(this));
  };

  this._commit = function(documentId, clientVersion, newChange, userId, cb) {
    // Get latest doc version
    this.store.getVersion(documentId, function(err, serverVersion) {
      if (serverVersion === clientVersion) { // Fast forward update
        this.store.addChange(documentId, this.serializeChange(newChange), userId, function(err, newVersion) {
          cb(null, newVersion, newChange, []);
        }.bind(this));
      } else { // Client changes need to be rebased to latest serverVersion
        this._rebaseChange(documentId, clientVersion, newChange, function(err, rebasedNewChange, rebasedOtherChanges) {
          this.store.addChange(documentId, this.serializeChange(rebasedNewChange), userId, function(err, newVersion) {
            cb(null, newVersion, rebasedNewChange, rebasedOtherChanges);
          }.bind(this));
        }.bind(this));
      }
    }.bind(this));
  };

  /*
    Collaborator leaves the party
  */
  this.leave = function(args) {
    this._unregister(args.collaboratorId, args.documentId);
  };

};

EventEmitter.extend(CollabEngine);

module.exports = CollabEngine;
