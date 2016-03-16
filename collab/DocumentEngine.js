"use strict";

var EventEmitter = require('../util/EventEmitter');
var JSONConverter = require('../model/JSONConverter');
var Err = require('../util/Error');

/*
  DocumentEngine
*/
function DocumentEngine(config) {
  DocumentEngine.super.apply(this);

  this.schemas = config.schemas;

  // Where changes are stored
  this.documentStore = config.documentStore;
  this.changeStore = config.changeStore;
  this.snapshotStore = config.snapshotStore;
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
      return cb(new Err('DocumentEngine.SchemaNotFoundError', {
        message: 'Schema not found for ' + args.schemaName
      }));
    }
    var docFactory = schemaConfig.documentFactory;

    this.documentStore.documentExists(args.documentId, function(err, exists) {
      if (err || exists) {
        return cb(new Err('DocumentEngine.CreateError', {
          message: !exists ? 'Document already exists' : null,
          cause: err
        }));
      }

      var doc = docFactory.createArticle();
      var changeset = docFactory.createChangeset();

      this.documentStore.createDocument({
        schemaName: schemaConfig.name,
        schemaVersion: schemaConfig.version,
        documentId: args.documentId,
        info: args.info
      }, function(err) {
        if (err) {
          return cb(new Err('DocumentEngine.CreateError', {
            cause: err
          }));
        }

        this.changeStore.addChange({
          documentId: args.documentId,
          change: changeset[0]
        }, function(err) {
          if (err) {
            return cb(new Err('DocumentEngine.CreateError', {
              cause: err
            }));
          }
          cb(null, {
            data: doc,
            version: 1
          });
        });
      }.bind(this));
    }.bind(this));
  };

  /*
    Get document snapshot.

    Uses schema information stored at the doc entry and
    constructs a document using the corresponding documentFactory
    that is available as a schema config object.

    @param args.documentId 
    @param args.version
  */
  this.getDocument = function(args, cb) {
    var documentId = args.documentId;
    // TODO: allow to getDocument for a particular version
    // var version = args.version;
    // TODO: Implement and use snapshots for faster access

    this.documentStore.getDocument(documentId, function(err, docRecord) {
      if (err) {
        return cb(new Err('DocumentEngine.ReadError', {
          cause: err
        }));
      }

      var schemaConfig = this.schemas[docRecord.schemaName];
      if (!schemaConfig) {
        return cb(new Err('DocumentEngine.SchemaNotFoundError', {
          message: 'Schema not found for ' + docRecord.schemaName
        }));
      }

      var docFactory = schemaConfig.documentFactory;
      this.getChanges({
        documentId: documentId,
        sinceVersion: 0
      }, function(err, res) {
        if (err) {
          return cb(new Err('DocumentEngine.ReadError', {
            cause: err
          }));
        }

        var doc = docFactory.createEmptyArticle();
        res.changes.forEach(function(change) {
          change.ops.forEach(function(op) {
            doc.data.apply(op);
          });
        });
        var converter = new JSONConverter();
        var output = {
          data: converter.exportDocument(doc),
          version: res.version
        };
        cb(null, output);
      });

    }.bind(this));

  };

  /*
    Delete document by documentId
  */
  this.deleteDocument = function(documentId, cb) {
    this.documentStore.deleteDocument(documentId, function(err, doc) {
      if (err) {
        return cb(new Err('DocumentEngine.DeleteDocumentError', {
          cause: err
        }));
      }
      cb(null, doc);
    });
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
        return cb(new Err('DocumentEngine.ReadError', {
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
        return cb(new Err('DocumentEngine.ReadError', {
          message: !exists ? 'Document does not exist' : null,
          cause: err
        }));
      }
      this.changeStore.getVersion(documentId, cb);
    }.bind(this));
  };

  /*
    Add change to a given documentId
  */
  this.addChange = function(args, cb) {
    this.documentExists(args.documentId, function(err, exists) {
      if (err || !exists) {
        return cb(new Err('DocumentEngine.ReadError', {
          message: !exists ? 'Document does not exist' : null,
          cause: err
        }));
      }
      this.changeStore.addChange(args, cb);
    }.bind(this)); 
  };
};

EventEmitter.extend(DocumentEngine);

module.exports = DocumentEngine;
