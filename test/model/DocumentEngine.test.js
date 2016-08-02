'use strict';
/* eslint-disable consistent-return */

var test = require('../test').module('model/DocumentEngine');

var DocumentStore = require('../../collab/DocumentStore');
var ChangeStore = require('../../collab/ChangeStore');
var DocumentEngine = require('../../collab/DocumentEngine');
var testDocumentEngine = require('../collab/testDocumentEngine');

var Configurator = require('../../util/Configurator');
var TestArticle = require('./TestArticle');
var TestMetaNode = require('./TestMetaNode');

var documentStoreSeed = require('../fixtures/documentStoreSeed');
var changeStoreSeed = require('../fixtures/changeStoreSeed');

var configurator = new Configurator();
configurator.defineSchema({
  name: 'prose-article',
  ArticleClass: TestArticle,
  defaultTextType: 'paragraph'
});
configurator.addNode(TestMetaNode);

var documentStore = new DocumentStore();
var changeStore = new ChangeStore();

var documentEngine = new DocumentEngine({
  configurator: configurator,
  documentStore: documentStore,
  changeStore: changeStore
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
}

function setupTest(description, fn) {
  test(description, function (t) {
    setup(fn, t);
  });
}

// Runs the offical backend test suite
testDocumentEngine(documentEngine, setupTest);