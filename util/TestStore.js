"use strict";

var EventEmitter = require('./EventEmitter');

/*
  Implements Substance Store API. This is just a stub and is used for
  testing.
*/
function TestStore(db) {
  TestStore.super.apply(this);

  // db the testhub operates on. It's just a simple object.
  this._db = db;
}

TestStore.Prototype = function() {
  /*
    Gets changes from the DB
  */
  this.getChanges = function(id, sinceVersion, cb) {
    var changes = this._getChanges(id);
    var currentVersion = this._getVersion(id);

    if (sinceVersion === 0) {
      cb(null, currentVersion, changes);
    } else {
      cb(null, currentVersion, changes.splice(sinceVersion - 1));
    }
  };

  /*
    Add a change
  */
  this.addChange = function(id, change, cb) {
    this._addChange(id, change);
    cb(null, this._getVersion(id));
  };

  /*
    Gets the version number for a document
  */
  this.getVersion = function(id, cb) {
    cb(null, this._getVersion(id));
  };

  this._getVersion = function(id) {
    return this._db[id].length;
  };

  this._getChanges = function(id) {
    return this._db[id];
  };

  this._addChange = function(id, change) {
    this._db[id].push(change);
  };

};

EventEmitter.extend(TestStore);
module.exports = TestStore;
