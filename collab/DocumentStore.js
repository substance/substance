'use strict';

var oo = require('../util/oo');
var extend = require('lodash/extend');
var Err = require('../util/SubstanceError');
var uuid = require('../util/uuid');

/*
  Implements Substance DocumentStore API. This is just a dumb store.
  No integrity checks are made, as this is the task of DocumentEngine
*/
function DocumentStore(config) {
  this.config = config;
}

DocumentStore.Prototype = function() {

  /*
    Create a new document record

    @return {Object} document record
  */
  this.createDocument = function(props, cb) {

    if (!props.documentId) {
      // We generate a documentId ourselves
      props.documentId = uuid();
    }

    var exists = this._documentExists(props.documentId);
    if (exists) {
      return cb(new Err('DocumentStore.CreateError', {
        message: 'Could not create because document already exists.'
      }));
    }
    this._createDocument(props);
    cb(null, this._getDocument(props.documentId));
  };

  /*
    Get document by documentId
  */
  this.getDocument = function(documentId, cb) {
    var doc = this._getDocument(documentId);
    if (!doc) {
      return cb(new Err('DocumentStore.ReadError', {
        message: 'Document could not be found.'
      }));
    }
    cb(null, doc);
  };

  /*
    Update document record
  */
  this.updateDocument = function(documentId, newProps, cb) {
    var exists = this._documentExists(documentId);
    if (!exists) {
      return cb(new Err('DocumentStore.UpdateError', {
        message: 'Document does not exist.'
      }));
    }
    this._updateDocument(documentId, newProps);
    cb(null, this._getDocument(documentId));
  };

  /*
    Delete document
  */
  this.deleteDocument = function(documentId, cb) {
    var doc = this._getDocument(documentId);
    if (!doc) {
      return cb(new Err('DocumentStore.DeleteError', {
        message: 'Document does not exist.'
      }));
    }
    this._deleteDocument(documentId);
    cb(null, doc);
  };

  /*
    Returns true if changeset exists
  */
  this.documentExists = function(documentId, cb) {
    cb(null, this._documentExists(documentId));
  };

  /*
    Seeds the database
  */
  this.seed = function(documents, cb) {
    this._documents = documents;
    if (cb) { cb(null); }
    return this;
  };

  // Handy synchronous helpers
  // -------------------------

  this._createDocument = function(props) {
    this._documents[props.documentId] = props;
  };

  this._deleteDocument = function(documentId) {
    delete this._documents[documentId];
  };

  // Get document record
  this._getDocument = function(documentId) {
    return this._documents[documentId];
  };

  this._updateDocument = function(documentId, props) {
    var doc = this._documents[documentId];
    extend(doc, props);
  };

  this._documentExists = function(documentId) {
    return !!this._documents[documentId];
  };
};


oo.initClass(DocumentStore);
module.exports = DocumentStore;
