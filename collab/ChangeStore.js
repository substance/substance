'use strict';

var oo = require('../util/oo');
var extend = require('lodash/extend');

/*
  Implements Substance ChangeStore API. This is just a dumb store.
  No integrity checks are made, as this is the task of DocumentEngine
*/
function ChangeStore(config) {
  this.config = config;
}

ChangeStore.Prototype = function() {

  /*
    Gets changes for a given document

    @param {String} args.documentId document id
    @param {Number} args.sinceVersion since which change
  */
  this.getChanges = function(args, cb) {
    var changes = this._getChanges(args.documentId);
    var version = this._getVersion(args.documentId);
    var res;

    if (args.sinceVersion === 0) {
      res = {
        version: version,
        changes: changes
      };
      cb(null, res);
    } else if (args.sinceVersion > 0) {
      res = {
        version: version,
        changes: changes.slice(args.sinceVersion)
      };
      cb(null, res);
    } else {
      cb(new Error('Illegal version: ' + args.sinceVersion));
    }
  };

  /*
    Add a change object to the database
  */
  this.addChange = function(args, cb) {
    this._addChange(args.documentId, args.change);
    var newVersion = this._getVersion(args.documentId);
    cb(null, newVersion);
  };

  /*
    Delete changes for a given documentId
  */
  this.deleteChanges = function(documentId, cb) {
    var deletedChanges = this._deleteChanges(documentId);
    cb(null, deletedChanges);
  };

  /*
    Gets the version number for a document
  */
  this.getVersion = function(id, cb) {
    cb(null, this._getVersion(id));
  };

  /*
    Seeds the database with given changes
  */
  this.seed = function(changes, cb) {
    this._changes = changes;
    if (cb) { cb(null); }
    return this;
  };

  // Handy synchronous helpers
  // -------------------------

  this._deleteChanges = function(documentId) {
    var changes = this._changes[documentId];
    delete this._changes[documentId];
    return changes;
  };

  this._getVersion = function(documentId) {
    return this._changes[documentId].length;
  };

  this._getChanges = function(documentId) {
    return this._changes[documentId];
  };

  this._addChange = function(documentId, change) {
    if (!this._changes[documentId]) {
      this._changes[documentId] = [];
    }
    this._changes[documentId].push(change);
  };
};

oo.initClass(ChangeStore);
module.exports = ChangeStore;
