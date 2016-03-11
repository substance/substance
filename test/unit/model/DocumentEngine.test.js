'use strict';

require('../qunit_extensions');

var documentStoreSeed = require('../../fixtures/collab/documentStoreSeed');
var changeStoreSeed = require('../../fixtures/collab/changeStoreSeed');
var DocumentStore = require('../../../collab/DocumentStore');
var ChangeStore = require('../../../collab/ChangeStore');
var DocumentEngine = require('../../../collab/DocumentEngine');
var testDocumentEngine = require('../../collab/testDocumentEngine');
var twoParagraphs = require('../../fixtures/collab/two-paragraphs');

var documentStore = new DocumentStore();
var changeStore = new ChangeStore();

var documentEngine = new DocumentEngine({
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

QUnit.module('collab/DocumentEngine', {
  beforeEach: function(assert) {
    var done = assert.async();
    var newDocumentStoreSeed = JSON.parse(JSON.stringify(documentStoreSeed));
    var newChangeStoreSeed = JSON.parse(JSON.stringify(changeStoreSeed));
    documentStore.seed(newDocumentStoreSeed, function(err) {
      if (err) return console.error(err);
      changeStore.seed(newChangeStoreSeed, function(err) {
        if (err) return console.error(err);
        done();
      });
    });
  }
});

// Runs the offical backend test suite
testDocumentEngine(documentEngine, QUnit);