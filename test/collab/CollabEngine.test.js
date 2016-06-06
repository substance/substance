'use strict';
/* eslint-disable consistent-return */

require('../QUnitExtensions');

var DocumentStore = require('../../collab/DocumentStore');
var ChangeStore = require('../../collab/ChangeStore');
var DocumentEngine = require('../../collab/DocumentEngine');
var CollabEngine = require('../../collab/CollabEngine');

var createTestDocumentFactory = require('../fixtures/createTestDocumentFactory');
var createTestArticle = require('../fixtures/createTestArticle');
var createChangeset = require('../fixtures/createChangeset');
var documentStoreSeed = require('../fixtures/documentStoreSeed');
var changeStoreSeed = require('../fixtures/changeStoreSeed');
var twoParagraphs = require('../fixtures/twoParagraphs');
var insertParagraph = require('../fixtures/insertParagraph');
var insertText = require('../fixtures/insertText');

// Equivalent to the 'test-doc' that is in the backend seed.
var testDoc = createTestArticle(twoParagraphs);

// Example changes should be something that depends on existing content, so we
// properly play the rebase scenario
var exampleChange = createChangeset(testDoc, insertParagraph);

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

var fakeChange = {
  before: {
    selection: null
  },
  after: {
    selection: null,
  },
  ops: []
};

var collabEngine;

QUnit.module('collab/CollabEngine', {
  beforeEach: function(assert) {
    var done = assert.async();
    var newDocumentStoreSeed = JSON.parse(JSON.stringify(documentStoreSeed));
    var newChangeStoreSeed = JSON.parse(JSON.stringify(changeStoreSeed));
    documentStore.seed(newDocumentStoreSeed, function(err) {
      if (err) return console.error(err);
      changeStore.seed(newChangeStoreSeed, function(err) {
        if (err) return console.error(err);
        collabEngine = new CollabEngine(documentEngine);
        done();
      });
    });
  }
});

QUnit.test('New collaborator enters with latest version', function(assert) {
  var done = assert.async();

  collabEngine.sync({
    collaboratorId: 'collab-1',
    documentId: 'test-doc',
    version: 1,
    change: fakeChange
  }, function(err, result) {
    assert.isNullOrUndefined(err, 'Should not error');
    assert.equal(result.version, 1);
    done();
  });
});

QUnit.test('New collaborator enters with an outdated version', function(assert) {
  var done = assert.async();

  collabEngine.sync({
    collaboratorId: 'collab-1',
    documentId: 'test-doc',
    version: 0,
    change: fakeChange
  }, function(err, result) {
    assert.isNullOrUndefined(err, 'Should not error');
    assert.equal(result.version, 1);
    done();
  });
});

QUnit.test('New collaborator enters with a new fast-forward change', function(assert) {
  console.error('THIS TEST NEEDS TO BE FIXED.');
  assert.ok(true, 'This test has been disabled');
  // var done = assert.async();
  // collabEngine.sync({
  //   collaboratorId: 'collab-1',
  //   documentId: 'test-doc',
  //   version: 1,
  //   change: exampleChange
  // }, function(err, result) {
  //   assert.isNullOrUndefined(err, 'Should not error');
  //   assert.equal(result.version, 2);
  //   done();
  // });
});

QUnit.test('New collaborator enters with a change that needs rebasing', function(assert) {
  console.error('THIS TEST NEEDS TO BE FIXED.');
  assert.ok(true, 'This test has been disabled');
  // var done = assert.async();
  // // We simulate that by letting another user 'collab-2' makeing a text change
  // // that affects a later text change of 'collab-1' - the one that needs rebasing.
  // var insertTextChange1 = insertText(testDoc, {
  //   path: ['p1', 'content'],
  //   pos: 1,
  //   text: '!'
  // });
  // var insertTextChange2 = insertText(testDoc, {
  //   path: ['p1', 'content'],
  //   pos: 5,
  //   text: '$$$'
  // }); // 5 is based on version 1, after rebasing should be 6

  // collabEngine.sync({
  //   collaboratorId: 'collab-1',
  //   documentId: 'test-doc',
  //   version: 1,
  //   change: insertTextChange1
  // }, function(err, result) {
  //   assert.isNullOrUndefined(err, 'Should not error');
  //   assert.equal(result.version, 2);

  //   collabEngine.sync({
  //     collaboratorId: 'collab-2',
  //     documentId: 'test-doc',
  //     version: 1,
  //     change: insertTextChange2
  //   }, function(err, result) {
  //     assert.isNullOrUndefined(err, 'Should not error');
  //     assert.equal(result.version, 3);
  //     assert.ok(result.serverChange, 'There should be a server change');
  //     assert.notDeepEqual(result.change, insertTextChange2, 'Tranformed change should differ from original change');
  //     done();
  //   });
  // });
});

QUnit.test('Two collaborators enter', function(assert) {
  var done = assert.async();
  collabEngine.sync({
    collaboratorId: 'collab-1',
    documentId: 'test-doc',
    version: 1,
    change: fakeChange
  }, function(err, result) {
    assert.ok(result, 'connect result should be set');
    collabEngine.sync({
      collaboratorId: 'collab-2',
      documentId: 'test-doc',
      version: 1,
      change: fakeChange
    }, function(err, result) {
      assert.ok(result, 'connect result should be set');
      assert.isNullOrUndefined(err, 'Should not error');
      var collaboratorIds = collabEngine.getCollaboratorIds('test-doc', 'collab-2');
      assert.deepEqual(collaboratorIds, ['collab-1'], 'Should return one collaboratorId');
      collaboratorIds = collabEngine.getCollaboratorIds('test-doc', 'collab-1');
      assert.deepEqual(collaboratorIds, ['collab-2'], 'Should return one collaboratorId');
      done();
    });
  });
});

QUnit.test('Collaborator does a fast-forward sync', function(assert) {
  console.error('THIS TEST NEEDS TO BE FIXED.');
  assert.ok(true, 'This test has been disabled');
  // var done = assert.async();
  // collabEngine.sync({
  //   collaboratorId: 'collab-1',
  //   documentId: 'test-doc',
  //   version: 1,
  //   change: fakeChange
  // }, function(err, result) {
  //   assert.isNullOrUndefined(err, 'Should not error on enter');
  //   assert.ok(result, 'connect should produce a result object');
  //   collabEngine.sync({
  //     collaboratorId: 'collab-1',
  //     documentId: 'test-doc',
  //     change: exampleChange,
  //     version: 1
  //   }, function(err, syncResult) {
  //     assert.equal(syncResult.version, 2, 'Version should be 2 after commit');
  //     assert.deepEqual(syncResult.change, exampleChange, 'Change should be untouched');
  //     done();
  //   });
  // });
});

QUnit.test('Collaborator does a sync that needs rebasing', function(assert) {
  // We may want to use a proper seed to simulate that scenario
  assert.ok(true, 'TODO: implement');
});
