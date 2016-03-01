'use strict';

var EventEmitter = require('../../util/EventEmitter');
var twoParagraphs = require('../fixtures/collab/two-paragraphs');
var JSONConverter = require('../../model/JSONConverter');

/*
  Implements Substance Store API. This is just a stub and is used for
  testing.
*/
function TestBackend(config) {
  TestBackend.super.apply(this);
  this.config = config;
}

TestBackend.Prototype = function() {

  /*
    Gets changes for a given document
  */
  this.getChanges = function(documentId, sinceVersion, cb) {
    var changes = this._getChanges(documentId);
    var currentVersion = this._getVersion(documentId);

    if (sinceVersion === 0) {
      cb(null, currentVersion, changes);
    } else if (sinceVersion > 0) {
      cb(null, currentVersion, changes.slice(sinceVersion));
    } else {
      throw new Error('Illegal version: ' + sinceVersion);
    }
  };

  /*
    Creates a new empty or prefilled document
  
    Writes the initial change into the database.
    Returns the JSON serialized version, as a starting point
  */
  this.createDocument = function(documentId, cb) {
    if (this._documentExists(documentId)) {
      return cb(new Error('Document already exists'));
    }
    var startingDoc = twoParagraphs.createArticle();
    var startingDocChanges = twoParagraphs.createChangeset();
    this._db.documents[documentId] = [];
    this._addChange(documentId, startingDocChanges[0]);
    cb(null, startingDoc);
  };

  /*
    Delete document
  */
  this.deleteDocument = function(documentId, cb) {
    var exists = this._documentExists(documentId);
    if (!exists) return cb(new Error('Document does not exist'));
    delete this._db.documents[documentId];
    cb(null);
  };

  /*
    Get document snapshot
  */
  this.getDocument = function(documentId, cb) {
    var self = this;
    this.getChanges(documentId, 0, function(err, version, changes) {
      if(err) return cb(err);
      var doc = new self.config.ArticleClass();
      changes.forEach(function(change) {
        change.ops.forEach(function(op) {
          doc.data.apply(op);
        });
      });
      var converter = new JSONConverter();
      cb(null, converter.exportDocument(doc), version);
    });
  };

  /*
    Returns true if changeset exists
  */
  this.documentExists = function(documentId, cb) {
    cb(null, this._documentExists());
  };

  /*
    Add a change object to the database
  */
  this.addChange = function(documentId, change, userId, cb) {
    var exists = this._documentExists(documentId);
    if (!exists) {
      return cb(new Error('Document '+documentId+' does not exist'));
    }
    this._addChange(documentId, change, userId);
    cb(null, this._getVersion(documentId));
  };

  /*
    Gets the version number for a document
  */
  this.getVersion = function(id, cb) {
    cb(null, this._getVersion(id));
  };

  /*
    Get user based on userId
  */
  this.getUser = function(userId, cb) {
    cb(null, this._getUser(userId));
  };

  /*
    Seeds the database
  */
  this.seed = function(seed, cb) {
    this._db = seed;
    cb(null, seed);
  };

  /*
    Remove a session based on a given session token
  */
  this.deleteSession = function(sessionToken) {
    // TODO: implement
    delete this._db.sessions[sessionToken];
  };

  /*
    Get session for a given session toke
  */
  this.getSession = function(sessionToken, cb) {
    var session = Object.assign({}, this._db.sessions[sessionToken]);
    // Create rich session
    session.user = this._getUser(session.userId);
    cb(null, session);
  };

  // Handy synchronous helpers
  // -------------------------

  this._documentExists = function(documentId) {
    return !!this._db.documents[documentId];
  };

  this._getVersion = function(documentId) {
    return this._db.documents[documentId].length;
  };

  this._getChanges = function(documentId) {
    return this._db.documents[documentId];
  };

  this._addChange = function(documentId, change) {
    this._db.documents[documentId].push(change);
  };

  this._getUser = function(userId) {
    return this._db.users[userId];
  };

};

EventEmitter.extend(TestBackend);
module.exports = TestBackend;
