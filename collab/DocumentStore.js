import oo from '../util/oo'
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
  createDocument(props, cb) {

    if (!props.documentId) {
      // We generate a documentId ourselves
      props.documentId = uuid()
    }

    let exists = this._documentExists(props.documentId);
    if (exists) {
      return cb(new Err('DocumentStore.CreateError', {
        message: 'Could not create because document already exists.'
      }))
    }
    this._createDocument(props)
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
  updateDocument(documentId, newProps, cb) {
    let exists = this._documentExists(documentId)
    if (!exists) {
      return cb(new Err('DocumentStore.UpdateError', {
        message: 'Document does not exist.'
      }))
    }
    this._updateDocument(documentId, newProps)
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

  _createDocument(props) {
    this._documents[props.documentId] = props
  }

  _deleteDocument(documentId) {
    delete this._documents[documentId]
  }

  // Get document record
  _getDocument(documentId) {
    return this._documents[documentId]
  }

  _updateDocument(documentId, props) {
    let doc = this._documents[documentId]
    extend(doc, props)
  }

  _documentExists(documentId) {
    return Boolean(this._documents[documentId])
  }
}

oo.initClass(DocumentStore)

export default DocumentStore
