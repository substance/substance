'use strict';

require('../qunit_extensions');

var error = require('../../../util/error');
var ChangeStore = require('../../../collab/ChangeStore');
var testChangeStore = require('../../collab/testChangeStore');
var changeStoreSeed = require('../../fixtures/collab/changeStoreSeed');
var changeStore = new ChangeStore();

QUnit.module('collab/ChangeStore', {
  beforeEach: function(assert) {
    var done = assert.async();

    // Make sure we create a new seed instance, as data ops
    // are performed directly on the seed object
    var newChangeStoreSeed = JSON.parse(JSON.stringify(changeStoreSeed));
    changeStore.seed(newChangeStoreSeed, function(err) {
      if (err) error(err);
      else done();
    });
  }
});

// Runs the offical backend test suite
testChangeStore(changeStore, QUnit);