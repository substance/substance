'use strict';

var EventEmitter = require('../util/EventEmitter');
var JSONConverter = require('../model/JSONConverter');
var matches = require('lodash/matches');
var filter = require('lodash/filter');
var map = require('lodash/map');
var uuid = require('../util/uuid');

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
    
    if (this._documentExists(documentId)) {
      var changes = this._getChanges(documentId);
      var currentVersion = this._getVersion(documentId);

      if (sinceVersion === 0) {
        cb(null, currentVersion, changes);
      } else if (sinceVersion > 0) {
        cb(null, currentVersion, changes.slice(sinceVersion));
      } else {
        cb(new Error('Illegal version: ' + sinceVersion));
      }
    } else {
      cb(new Error('Document does not exist'));
    }
  };

  /*
    Creates a new empty or prefilled document
  
    Writes the initial change into the database.
    Returns the JSON serialized version, as a starting point
  */
  this.createDocument = function(documentId, schemaName, userId, cb) {
    var schemaConfig = this.config.schemas[schemaName];
    if (!schemaConfig) {
      cb(new Error('Schema '+schemaName+' not found'));
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
      documentId: documentId,
      userId: userId,
      changes: []
    };
    this._addChange(documentId, changeset[0]);

    var res = {
      data: doc,
      version: 1
    };
    cb(null, res);
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
    var docRecord = this._db.documents[documentId];
    if (!docRecord) {
      return cb(new Error('Document does not exist'));
    }

    var schemaConfig = this.config.schemas[docRecord.schema.name];
    if (!schemaConfig) {
      cb(new Error('Schema '+docRecord.schema.name+' not found'));
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
      var res = {
        data: converter.exportDocument(doc),
        version: version,
        userId: docRecord.userId
      };
      cb(null, res);
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
    var user = this._getUser(userId);
    if (user) {
      cb(null, user);
    } else {
      cb(new Error('User not found'));
    }
  };

  /*
    Create a new use
  */
  this.createUser = function(userData, cb) {
    if (this._userExists(userData.userId)) {
      cb(new Error('User already exists'));
    } else {
      this._createUser(userData);
      cb(null, userData);
    }
  };

  /*
    Delete user based on userId
  */
  this.deleteUser = function(userId, cb) {
    if (this._userExists(userId)) {
      cb(new Error('User already exists'));
    } else {
      this._deleteUser(userId);
      cb(null);
    }
  };

  /*
    List available documents
  */
  this.listDocuments = function(filters, cb) {
    var documents = map(this._db.documents, function(doc) {
      return {
        documentId: doc.documentId,
        userId: doc.userId,
        schema: doc.schema
      };
    });

    // Filter doc based on provided filters argument
    documents = filter(documents, matches(filters));
    cb(null, documents);
  };

  /*
    Authenticate based on loginData object

    Stub implementation only supports authenticating though an
    existing sessionToken. It's kind of a fake login

    Please test this throughly in your persisted backend implementation.
  */
  this.authenticate = function(loginData, cb) {
    var session = this._db.sessions[loginData.sessionToken];
    if (session) {
      // Remove old session and create new session
      this._deleteSession(session.sessionToken);
      var newSession = this._createSession(session.userId);
      this.getSession(newSession.sessionToken, cb);
    } else {
      cb(new Error('No session found for '+ loginData.sessionToken));
    }
  };

  /*
    Remove a session based on a given session token
  */
  this.deleteSession = function(sessionToken, cb) {
    if (this._sessionExists(sessionToken)) {
      this._deleteSession(sessionToken);
      cb(null);
    } else {
      cb(new Error('Session does not exist'));
    }
  };

  /*
    Get session for a given session toke
  */
  this.getSession = function(sessionToken, cb) {
    var session = this._db.sessions[sessionToken];
    if (session) {
      // Create rich session
      var richSession = Object.assign({}, this._db.sessions[sessionToken]);
      richSession.user = this._getUser(session.userId);
      cb(null, richSession);
    } else {
      cb(new Error('No session found for sessionToken: '+ sessionToken));
    }
  };

  /*
    Seeds the database
  */
  this.seed = function(seed, cb) {
    this._db = seed;
    cb(null, seed);
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

  this._createUser = function(userData) {
    this._db.users[userData.userId] = userData;
  };

  this._userExists = function(userId) {
    return !!this._db.users[userId];
  };

  this._deleteUser = function(userId) {
    delete this._db.users[userId];
  };

  this._sessionExists = function(sessionToken) {
    return !!this._db.sessions[sessionToken];
  };

  this._createSession = function(userId) {
    var newSession = {
      sessionToken: uuid(),
      userId: userId
    };
    this._db.sessions[newSession.sessionToken] = newSession;
    return newSession;
  };

  this._deleteSession = function(sessionToken) {
    delete this._db.sessions[sessionToken];
  };

  this._userExists = function(userId) {
    return !!this._db.users[userId];
  };

  this._deleteUser = function(userId) {
    delete this._db.users[userId];
  };

};

EventEmitter.extend(MemoryBackend);
module.exports = MemoryBackend;
