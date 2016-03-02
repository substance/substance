'use strict';

var EventEmitter = require('../util/EventEmitter');
var JSONConverter = require('../model/JSONConverter');

/*
  Implements Substance Store API. This is just a stub and is used for
  testing.
*/
function MemoryBackend(config) {
  MemoryBackend.super.apply(this);
  this.config = config;
}

MemoryBackend.Prototype = function() {

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
  this.createDocument = function(documentId, schemaName, cb) {
    var schemaConfig = this.config.schemas[schemaName];
    if (!schemaConfig) {
      cb(new new Error('Schema '+schemaName+' not found'));
    }
    var docFactory = schemaConfig.documentFactory;

    if (this._documentExists(documentId)) {
      return cb(new Error('Document already exists'));
    }

    var doc = docFactory.createArticle();
    var changeset = docFactory.createChangeset();
    this._db.documents[documentId] = {
      schema: {
        name: schemaConfig.name,
        version: schemaConfig.version
      },
      changes: []
    };
    this._addChange(documentId, changeset[0]);
    cb(null, doc);
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
    Get document snapshot.

    Uses schema information stored at the doc entry and
    constructs a document using the corresponding documentFactory
    that is available as a schema config object.
  */
  this.getDocument = function(documentId, cb) {
    var doc = this._db.documents[documentId];
    if (!doc) {
      return cb(new Error('Document does not exist'));
    }

    var schemaConfig = this.config.schemas[doc.schema.name];
    if (!schemaConfig) {
      cb(new new Error('Schema '+doc.schema.name+' not found'));
    }

    var docFactory = schemaConfig.documentFactory;
    this.getChanges(documentId, 0, function(err, version, changes) {
      if(err) return cb(err);
      var doc = docFactory.createEmptyArticle();
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
    return this._db.documents[documentId].changes.length;
  };

  this._getChanges = function(documentId) {
    return this._db.documents[documentId].changes;
  };

  this._addChange = function(documentId, change) {
    this._db.documents[documentId].changes.push(change);
  };

  this._getUser = function(userId) {
    return this._db.users[userId];
  };


};

EventEmitter.extend(MemoryBackend);
module.exports = MemoryBackend;
