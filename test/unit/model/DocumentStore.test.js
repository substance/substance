'use strict';

require('../qunit_extensions');

var documentStoreSeed = require('../../fixtures/collab/documentStoreSeed');
var DocumentStore = require('../../../collab/DocumentStore');
var testDocumentStore = require('../../collab/testDocumentStore');
var twoParagraphs = require('../../fixtures/collab/two-paragraphs');

var store = new DocumentStore({
  schemas: {
    'prose-article': {
      name: 'prose-article',
      version: '1.0.0',
      documentFactory: twoParagraphs
    }
  }
});

QUnit.module('collab/DocumentStore', {
  beforeEach: function(assert) {
    var done = assert.async();

    // Make sure we create a new seed instance, as data ops
    // are performed directly on the seed object
    var newDocumentStoreSeed = JSON.parse(JSON.stringify(documentStoreSeed));
    store.seed(newBackendSeed, function(err) {
      if (err) {
        return console.error(err);
      } else {
        done();
      }
    });
  }
});

// Runs the offical backend test suite
runBackendTests(store, QUnit);