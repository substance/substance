'use strict';

require('../QUnitExtensions');

var SnapshotStore = require('../../collab/SnapshotStore');
var testSnapshotStore = require('../collab/testSnapshotStore');
var snapshotStoreSeed = require('../fixtures/snapshotStoreSeed');
var store = new SnapshotStore();

QUnit.module('collab/SnapshotStore', {
  beforeEach: function(assert) {
    var done = assert.async();
    // Make sure we create a new seed instance, as data ops
    // are performed directly on the seed object
    var newSnapshotStoreSeed = JSON.parse(JSON.stringify(snapshotStoreSeed));
    store.seed(newSnapshotStoreSeed, function(err) {
      if (err) {
        console.error(err);
      } else {
        done();
      }
    });
  }
});

// Runs the offical backend test suite
testSnapshotStore(store, QUnit);
