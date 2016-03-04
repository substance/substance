"use strict";

var EventEmitter = require('../util/EventEmitter');
var forEach = require('lodash/forEach');
var DocumentChange = require('../model/DocumentChange');
var uuid = require('../util/uuid');

/*
  Engine for realizing collaborative editing. Implements the server-methods of 
  the real time editing as a library.
*/

function CollabEngine(wss, store) {
  CollabEngine.super.apply(this);

  this.wss = wss;

  // Where docs, users and sessions are stored
  this.store = store;
  this._onConnection = this._onConnection.bind(this);
  this.wss.on('connection', this._onConnection);
  this._connections = new WeakMap();
}

CollabEngine.Prototype = function() {

  /*
    Start a new collaborative editing session.

    @param args.documentId
    @param args.version The client's document version (0 if client starts with an empty doc)
    @param args.change pending client change

    Note: a client can reconnect having a pending change
    which is similar to the commit case
  */
  this.start = function(args, cb) {
    var conn = this._connections.get(ws);
    var self = this;

    if (conn.documents[documentId]) {
      console.error('Connection is already registered for document', documentId);
    }

    // Get other connected collaborators for document
    var collaborators = this.getCollaborators(ws, documentId);
    
    // Update connection state
    conn.documents[documentId] = {
      selection: null
    };
    conn.userSession = userSession;
      
    if (change) {
      this._rebasedOpen(args, cb);
    } else {
      this._fastForwardOpen(args, cb);
    }
  };

  this._rebasedStart = function(args, cb) {
    this._commit(args, function(err, result) {
      if (err) return cb(err);
      this._completeStart(result, cb);
    });
  };

  this._fastForwardStart = function(args, cb) {
    this._commit(args, function(err, result) {
      if (err) return cb(err);
      
      self.store.getChanges(documentId, clientVersion, function(err, serverVersion, changes) {
        cb(serverVersion, null, changes);
      });
    });
  };

  this._completeStart = function(args) {
    
  };



};

EventEmitter.extend(CollabHub);

module.exports = CollabHub;
