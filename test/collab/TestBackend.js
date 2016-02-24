'use strict';

var EventEmitter = require('../../util/EventEmitter');

var USERS = {
  'user1': {
    'userId': 'user1',
    'password': 'demo',
    'name': 'User 1'
  },
  'user2': {
    'userId': 'user2',
    'password': 'demo',
    'name': 'User 2'
  }
};

var SESSIONS = {
  'user1token': {
    'user': USERS['user1'],
    'sessionToken': 'user1token'
  },
  'user2token': {
    'user': USERS['user2'],
    'sessionToken': 'user2token'
  }
};

/*
  Implements Substance Store API. This is just a stub and is used for
  testing.
*/
function TestBackend(db) {
  TestBackend.super.apply(this);

  // Just a simple object serves us as a db
  this._db = db;
}

TestBackend.Prototype = function() {
  /*
    Gets changes from the DB
  */
  this.getChanges = function(id, sinceVersion, cb) {
    var changes = this._getChanges(id);
    var currentVersion = this._getVersion(id);

    if (sinceVersion === 0) {
      cb(null, currentVersion, changes);
    } else if (sinceVersion > 0) {
      cb(null, currentVersion, changes.slice(sinceVersion));
    } else {
      throw new Error('Illegal version: ' + sinceVersion);
    }
  };

  /*
    Add a change
  */
  this.addChange = function(id, change, userId, cb) {
    this._addChange(id, change, userId);
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

  this.getUser = function(userId, cb) {
    cb(null, USERS[userId]);
  };

  this.deleteSession = function(/*sessionToken*/) {
    // TODO: implement
  };

  this.getSession = function(sessionToken, cb) {
    cb(null, SESSIONS[sessionToken]);
  };

};

EventEmitter.extend(TestBackend);
module.exports = TestBackend;
