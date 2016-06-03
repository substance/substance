'use strict';
/* eslint-disable consistent-return */

require('../qunit_extensions');

var error = require('../../../util/error');
var documentStoreSeed = require('../../fixtures/collab/documentStoreSeed');
var changeStoreSeed = require('../../fixtures/collab/changeStoreSeed');
var snapshotStoreSeed = require('../../fixtures/collab/snapshotStoreSeed');
var DocumentStore = require('../../../collab/DocumentStore');
var SnapshotStore = require('../../../collab/SnapshotStore');
var ChangeStore = require('../../../collab/ChangeStore');
var SnapshotEngine = require('../../../collab/SnapshotEngine');
var testSnapshotEngine = require('../../collab/testSnapshotEngine');
var testSnapshotEngineWithStore = require('../../collab/testSnapshotEngineWithStore');
var twoParagraphs = require('../../fixtures/collab/two-paragraphs');

// Setup store instances

var documentStore = new DocumentStore();
var changeStore = new ChangeStore();
var snapshotEngine = new SnapshotEngine({
  documentStore: documentStore,
  changeStore: changeStore,
  schemas: {
    'prose-article': {
      name: 'prose-article',
      version: '1.0.0',
      documentFactory: twoParagraphs
    }
  }
});
var snapshotStore = new SnapshotStore();
var snapshotEngineWithStore = new SnapshotEngine({
  documentStore: documentStore,
  changeStore: changeStore,
  snapshotStore: snapshotStore,
  schemas: {
    'prose-article': {
      name: 'prose-article',
      version: '1.0.0',
      documentFactory: twoParagraphs
    }
  }
});

QUnit.module('collab/SnapshotEngine', {
  beforeEach: function(assert) {
    var done = assert.async();
    var newDocumentStoreSeed = JSON.parse(JSON.stringify(documentStoreSeed));
    var newChangeStoreSeed = JSON.parse(JSON.stringify(changeStoreSeed));
    var newSnapshotStoreSeed = JSON.parse(JSON.stringify(snapshotStoreSeed));

    documentStore.seed(newDocumentStoreSeed, function(err) {
      if (err) return error(err);
      changeStore.seed(newChangeStoreSeed, function(err) {
        if (err) return error(err);
        snapshotStore.seed(newSnapshotStoreSeed, function(err) {
          if (err) return error(err);
          done();
        });
      });
    });
  }
});

// Run the generic testsuite with an engine that does not have a store attached
testSnapshotEngine(snapshotEngine, twoParagraphs, QUnit);
// Run the same testsuite but this time with a store
testSnapshotEngine(snapshotEngineWithStore, twoParagraphs, QUnit);

// Run tests that are only relevant when a snapshot store is provided to the engine
testSnapshotEngineWithStore(snapshotEngineWithStore, twoParagraphs, QUnit);