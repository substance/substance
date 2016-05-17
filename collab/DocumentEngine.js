"use strict";

var EventEmitter = require('../util/EventEmitter');
var JSONConverter = require('../model/JSONConverter');
var Err = require('../util/SubstanceError');
var SnapshotEngine = require('./SnapshotEngine');

/*
  DocumentEngine
*/
function DocumentEngine(config) {
  DocumentEngine.super.apply(this);

  this.schemas = config.schemas;

  // Where changes are stored
  this.documentStore = config.documentStore;
  this.changeStore = config.changeStore;

  // SnapshotEngine instance is required
  this.snapshotEngine = config.snapshotEngine || new SnapshotEngine({
    schemas: this.schemas,
    documentStore: this.documentStore,
    changeStore: this.changeStore
  });
}

DocumentEngine.Prototype = function() {

  /*
    Creates a new empty or prefilled document

    Writes the initial change into the database.
    Returns the JSON serialized version, as a starting point
  */
  this.createDocument = function(args, cb) {
    var schemaConfig = this.schemas[args.schemaName];
    if (!schemaConfig) {
      return cb(new Err('SchemaNotFoundError', {
        message: 'Schema not found for ' + args.schemaName
      }));
    }
    var docFactory = schemaConfig.documentFactory;
    var doc = docFactory.createArticle();
    var change = docFactory.createChangeset()[0];

    // HACK: we use the info object for the change as well, however
    // we should be able to control this separately.
    change.info = args.info;

    this.documentStore.createDocument({
      schemaName: schemaConfig.name,
      schemaVersion: schemaConfig.version,
      documentId: args.documentId,
      version: 1, // we always start with version 1
      info: args.info
    }, function(err, docRecord) {
      if (err) {
        return cb(new Err('CreateError', {
          cause: err
        }));
      }

      this.changeStore.addChange({
        documentId: docRecord.documentId,
        change: change
      }, function(err) {
        if (err) {
          return cb(new Err('CreateError', {
            cause: err
          }));
        }

        var converter = new JSONConverter();
        cb(null, {
          documentId: docRecord.documentId,
          data: converter.exportDocument(doc),
          version: 1
        });
      });
    }.bind(this));
  };

  /*
    Get a document snapshot.

    @param args.documentId
    @param args.version
  */
  this.getDocument = function(args, cb) {
    this.snapshotEngine.getSnapshot(args, cb);
  };

  /*
    Delete document by documentId
  */
  this.deleteDocument = function(documentId, cb) {
    this.documentStore.deleteDocument(documentId, function(err, doc) {
      if (err) {
        return cb(new Err('DeleteError', {
          cause: err
        }));
      }
      this.changeStore.deleteChanges(documentId, function(err) {
        if (err) {
          return cb(new Err('DeleteError', {
            cause: err
          }));
        }
        cb(null, doc);
      });
    }.bind(this));
  };

  /*
    Check if a given document exists
  */
  this.documentExists = function(documentId, cb) {
    this.documentStore.documentExists(documentId, cb);
  };

  /*
    Get changes based on documentId, sinceVersion
  */
  this.getChanges = function(args, cb) {
    this.documentExists(args.documentId, function(err, exists) {
      if (err || !exists) {
        return cb(new Err('ReadError', {
          message: !exists ? 'Document does not exist' : null,
          cause: err
        }));
      }
      this.changeStore.getChanges(args, cb);
    }.bind(this));
  };

  /*
    Get version for given documentId
  */
  this.getVersion = function(documentId, cb) {
    this.documentExists(documentId, function(err, exists) {
      if (err || !exists) {
        return cb(new Err('ReadError', {
          message: !exists ? 'Document does not exist' : null,
          cause: err
        }));
      }
      this.changeStore.getVersion(documentId, cb);
    }.bind(this));
  };

  /*
    Add change to a given documentId

    args: documentId, change [, documentInfo]
  */
  this.addChange = function(args, cb) {
    this.documentExists(args.documentId, function(err, exists) {
      if (err || !exists) {
        return cb(new Err('ReadError', {
          message: !exists ? 'Document does not exist' : null,
          cause: err
        }));
      }
      this.changeStore.addChange(args, function(err, newVersion) {
        if (err) return cb(err);
        // We write the new version to the document store.
        this.documentStore.updateDocument(args.documentId, {
          version: newVersion,
          // Store custom documentInfo
          info: args.documentInfo
        }, function(err) {
          if (err) return cb(err);
          this.snapshotEngine.requestSnapshot(args.documentId, function() {
            // no matter if errored or not we will complete the addChange
            // successfully
            cb(null, newVersion);
          });
        }.bind(this));
      }.bind(this));
    }.bind(this));
  };

};

EventEmitter.extend(DocumentEngine);

module.exports = DocumentEngine;
