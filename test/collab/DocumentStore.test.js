'use strict';

require('../QUnitExtensions');

var DocumentStore = require('../../collab/DocumentStore');
var testDocumentStore = require('./testDocumentStore');
var documentStoreSeed = require('../fixtures/documentStoreSeed');
var store = new DocumentStore();

QUnit.module('collab/DocumentStore', {
  beforeEach: function(assert) {
    var done = assert.async();

    // Make sure we create a new seed instance, as data ops
    // are performed directly on the seed object
    var newDocumentStoreSeed = JSON.parse(JSON.stringify(documentStoreSeed));
    store.seed(newDocumentStoreSeed, function(err) {
      if (err) console.error(err);
      else done();
    });
  }
});

// Runs the offical backend test suite
testDocumentStore(store, QUnit);