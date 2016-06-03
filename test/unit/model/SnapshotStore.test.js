'use strict';

require('../qunit_extensions');

var error = require('../../../util/error');
var snapshotStoreSeed = require('../../fixtures/collab/snapshotStoreSeed');
var SnapshotStore = require('../../../collab/SnapshotStore');
var testSnapshotStore = require('../../collab/testSnapshotStore');
var store = new SnapshotStore();

QUnit.module('collab/SnapshotStore', {
  beforeEach: function(assert) {
    var done = assert.async();

    // Make sure we create a new seed instance, as data ops
    // are performed directly on the seed object
    var newSnapshotStoreSeed = JSON.parse(JSON.stringify(snapshotStoreSeed));
    store.seed(newSnapshotStoreSeed, function(err) {
      if (err) {
        error(err);
      } else {
        done();
      }
    });
  }
});

// Runs the offical backend test suite
testSnapshotStore(store, QUnit);