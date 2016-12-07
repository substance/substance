import EventEmitter from '../util/EventEmitter'
import JSONConverter from '../model/JSONConverter'
import Err from '../util/SubstanceError'
import SnapshotEngine from './SnapshotEngine'

/*
  DocumentEngine

  TODO: should we only pass the configurator, instead of the config object?
*/
class DocumentEngine extends EventEmitter {
  constructor(config) {
    super()

    this.configurator = config.configurator
    // Where changes are stored
    this.documentStore = config.documentStore
    this.changeStore = config.changeStore
    this.snapshotStore = config.snapshotStore

    // SnapshotEngine instance is required
    this.snapshotEngine = config.snapshotEngine || new SnapshotEngine({
      configurator: this.configurator,
      documentStore: this.documentStore,
      changeStore: this.changeStore,
      snapshotStore: this.snapshotStore
    })
  }

  /*
    Creates a new empty or prefilled document

    Writes the initial change into the database.
    Returns the JSON serialized version, as a starting point
  */

  // TODO: Document creation should happen in the client. Then we can get
  //       rid of schema-awareness in the document engine.

  createDocument(args, cb) {
    let schema = this.configurator.getSchema()
    if (!schema) {
      return cb(new Err('SchemaNotFoundError', {
        message: 'Schema not found for ' + args.schemaName
      }))
    }

    let doc = this.configurator.createArticle()

    // TODO: I have the feeling that this is the wrong approach.
    // While in our tests we have seeds I don't think that this is a general pattern.
    // A vanilla document should be just empty, or just have what its constructor
    // is creating.
    // To create some initial content, we should use the editor,
    // e.g. an automated script running after creating the document.

    // HACK: we use the info object for the change as well, however
    // we should be able to control this separately.

    this.documentStore.createDocument({
      schemaName: schema.name,
      schemaVersion: schema.version,
      documentId: args.documentId,
      version: 0, // we start with version 0 and waiting for the initial seed change from client
      info: args.info
    }, function(err, docRecord) {
      if (err) {
        return cb(new Err('CreateError', {
          cause: err
        }))
      }

      let converter = new JSONConverter();
      cb(null, {
        documentId: docRecord.documentId,
        data: converter.exportDocument(doc),
        version: 0
      })
    }.bind(this)) //eslint-disable-line
  }

  /*
    Get a document snapshot.

    @param args.documentId
    @param args.version
  */
  getDocument(args, cb) {
    this.snapshotEngine.getSnapshot(args, cb)
  }

  /*
    Delete document by documentId
  */
  deleteDocument(documentId, cb) {
    this.changeStore.deleteChanges(documentId, function(err) {
      if (err) {
        return cb(new Err('DeleteError', {
          cause: err
        }))
      }
      this.documentStore.deleteDocument(documentId, function(err, doc) {
        if (err) {
          return cb(new Err('DeleteError', {
            cause: err
          }))
        }
        cb(null, doc)
      });
    }.bind(this))
  }

  /*
    Check if a given document exists
  */
  documentExists(documentId, cb) {
    this.documentStore.documentExists(documentId, cb)
  }

  /*
    Get changes based on documentId, sinceVersion
  */
  getChanges(args, cb) {
    this.documentExists(args.documentId, function(err, exists) {
      if (err || !exists) {
        return cb(new Err('ReadError', {
          message: !exists ? 'Document does not exist' : null,
          cause: err
        }))
      }
      this.changeStore.getChanges(args, cb)
    }.bind(this))
  }

  /*
    Get version for given documentId
  */
  getVersion(documentId, cb) {
    this.documentExists(documentId, function(err, exists) {
      if (err || !exists) {
        return cb(new Err('ReadError', {
          message: !exists ? 'Document does not exist' : null,
          cause: err
        }))
      }
      this.changeStore.getVersion(documentId, cb)
    }.bind(this))
  }

  /*
    Add change to a given documentId

    args: documentId, change [, documentInfo]
  */
  addChange(args, cb) {
    this.documentExists(args.documentId, function(err, exists) {
      if (err || !exists) {
        return cb(new Err('ReadError', {
          message: !exists ? 'Document does not exist' : null,
          cause: err
        }))
      }
      this.changeStore.addChange(args, function(err, newVersion) {
        if (err) return cb(err);
        // We write the new version to the document store.
        this.documentStore.updateDocument(args.documentId, {
          version: newVersion,
          // Store custom documentInfo
          info: args.documentInfo
        }, function(err) {
          if (err) return cb(err)
          this.snapshotEngine.requestSnapshot(args.documentId, newVersion, function() {
            // no matter if errored or not we will confirm the new change
            cb(null, newVersion)
          })
        }.bind(this))
      }.bind(this))
    }.bind(this))
  }
}

export default DocumentEngine
