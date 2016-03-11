'use strict';

var oo = require('../util/oo');
var extend = require('lodash/extend');

/*
  Implements Substance DocumentStore API. This is just a dumb store.
  No integrity checks are made, as this is the task of DocumentEngine
*/
function DocumentStore(config) {
  this.config = config;

  // We will store data here
  this._db = {};
}

DocumentStore.Prototype = function() {

  /*
    Create a new document record
  */
  this.createDocument = function(props, cb) {
    var exists = this._documentExists(props.documentId);
    if (exists) return cb(new Error('Document already exists'));
    this._createDocument(props);
    cb(null, this._getDocument(props.documentId));
  };

  /*
    Get document by documentId
  */  
  this.getDocument = function(documentId, cb) {
    var doc = this._getDocument(documentId);
    if (!doc) return cb(new Error('Document does not exist'));
    cb(null, doc);
  };

  /*
    Update document record
  */
  this.updateDocument = function(documentId, newProps, cb) {
    var exists = this._documentExists(documentId);
    if (!exists) return cb(new Error('Document does not exist'));
    this._updateDocument(documentId, newProps);
    cb(null, this._getDocument(documentId));
  };

  /*
    Delete document
  */
  this.deleteDocument = function(documentId, cb) {
    var doc = this._getDocument(documentId);
    if (!doc) return cb(new Error('Document does not exist'));
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
    var doc = this._documents[props.documentId];
    extend(doc, props);
  };

  this._documentExists = function(documentId) {
    return !!this._documents[documentId];
  };

};

oo.initClass(DocumentStore);
module.exports = DocumentStore;
