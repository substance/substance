import extend from 'lodash/extend'
import Err from '../util/SubstanceError'
import uuid from '../util/uuid'

/*
  Implements Substance DocumentStore API. This is just a dumb store.
  No integrity checks are made, as this is the task of DocumentEngine
*/
class DocumentStore {
  constructor(config) {
    this.config = config
  }

  /*
    Create a new document record

    @return {Object} document record
  */
  createDocument(params, cb) {

    if (!params.documentId) {
      // We generate a documentId ourselves
      params.documentId = uuid()
    }

    let exists = this._documentExists(params.documentId);
    if (exists) {
      return cb(new Err('DocumentStore.CreateError', {
        message: 'Could not create because document already exists.'
      }))
    }
    this._createDocument(params)
  }

  /*
    Get document by documentId
  */
  getDocument(documentId, cb) {
    let doc = this._getDocument(documentId)
    if (!doc) {
      return cb(new Err('DocumentStore.ReadError', {
        message: 'Document could not be found.'
      }))
    }
    cb(null, doc)
  }

  /*
    Update document record
  */
  updateDocument(documentId, newparams, cb) {
    let exists = this._documentExists(documentId)
    if (!exists) {
      return cb(new Err('DocumentStore.UpdateError', {
        message: 'Document does not exist.'
      }))
    }
    this._updateDocument(documentId, newparams)
    cb(null, this._getDocument(documentId))
  }

  /*
    Delete document
  */
  deleteDocument(documentId, cb) {
    let doc = this._getDocument(documentId)
    if (!doc) {
      return cb(new Err('DocumentStore.DeleteError', {
        message: 'Document does not exist.'
      }))
    }
    this._deleteDocument(documentId)
    cb(null, doc)
  }

  /*
    Returns true if changeset exists
  */
  documentExists(documentId, cb) {
    cb(null, this._documentExists(documentId))
  }

  /*
    Seeds the database
  */
  seed(documents, cb) {
    this._documents = documents
    if (cb) { cb(null) }
    return this
  }

  // Handy synchronous helpers
  // -------------------------

  _createDocument(params) {
    this._documents[params.documentId] = params
  }

  _deleteDocument(documentId) {
    delete this._documents[documentId]
  }

  // Get document record
  _getDocument(documentId) {
    return this._documents[documentId]
  }

  _updateDocument(documentId, params) {
    let doc = this._documents[documentId]
    extend(doc, params)
  }

  _documentExists(documentId) {
    return Boolean(this._documents[documentId])
  }
}


export default DocumentStore
