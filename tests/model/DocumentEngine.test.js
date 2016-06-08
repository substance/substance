'use strict';
/* eslint-disable consistent-return */

var test = require('../test');

var DocumentStore = require('../../collab/DocumentStore');
var ChangeStore = require('../../collab/ChangeStore');
var DocumentEngine = require('../../collab/DocumentEngine');
var testDocumentEngine = require('../collab/testDocumentEngine');

var createTestDocumentFactory = require('../fixtures/createTestDocumentFactory');
var twoParagraphs = require('../fixtures/twoParagraphs');
var documentStoreSeed = require('../fixtures/documentStoreSeed');
var changeStoreSeed = require('../fixtures/changeStoreSeed');

var documentStore = new DocumentStore();
var changeStore = new ChangeStore();

var documentEngine = new DocumentEngine({
  documentStore: documentStore,
  changeStore: changeStore,
  schemas: {
    'prose-article': {
      name: 'prose-article',
      version: '1.0.0',
      documentFactory: createTestDocumentFactory(twoParagraphs)
    }
  }
});

function setup(cb, t) {
  var newDocumentStoreSeed = JSON.parse(JSON.stringify(documentStoreSeed));
  var newChangeStoreSeed = JSON.parse(JSON.stringify(changeStoreSeed));
  documentStore.seed(newDocumentStoreSeed, function(err) {
    if (err) return console.error(err);
    changeStore.seed(newChangeStoreSeed, function(err) {
      if (err) return console.error(err);
      cb(t);
    });
  });
};

function setupTest(description, fn) {
  test(description, function (t) {
    setup(fn, t);
  });
};

// Runs the offical backend test suite
testDocumentEngine(documentEngine, setupTest);