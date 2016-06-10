'use strict';

var test = require('../test').module('collab/SnapshotStore');

var SnapshotStore = require('../../collab/SnapshotStore');
var testSnapshotStore = require('../collab/testSnapshotStore');
var snapshotStoreSeed = require('../fixtures/snapshotStoreSeed');
var store = new SnapshotStore();

function setup(cb, t) {
  // Make sure we create a new seed instance, as data ops
  // are performed directly on the seed object
  var newSnapshotStoreSeed = JSON.parse(JSON.stringify(snapshotStoreSeed));
  store.seed(newSnapshotStoreSeed, function(err) {
    if (err) {
      console.error(err);
    } else {
      cb(t);
    }
  });
};

function setupTest(description, fn) {
  test(description, function (t) {
    setup(fn, t);
  });
};

// Runs the offical backend test suite
testSnapshotStore(store, setupTest);
