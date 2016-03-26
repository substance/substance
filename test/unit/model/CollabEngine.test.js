'use strict';

require('../qunit_extensions');

var documentStoreSeed = require('../../fixtures/collab/documentStoreSeed');
var changeStoreSeed = require('../../fixtures/collab/changeStoreSeed');
var DocumentStore = require('../../../collab/DocumentStore');
var ChangeStore = require('../../../collab/ChangeStore');
var DocumentEngine = require('../../../collab/DocumentEngine');
var twoParagraphs = require('../../fixtures/collab/two-paragraphs');
var insertParagraph = require('../../fixtures/collab/insertParagraph');
var insertText = require('../../fixtures/collab/insertText');
var CollabEngine = require('../../../collab/CollabEngine');

// Equivalent to the 'test-doc' that is in the backendseed.
var testDoc = twoParagraphs.createArticle();

// Example changes should be something that depends on existing content, so we
// properly play the rebase scenario
var exampleChange = insertParagraph(testDoc);

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
    assert.equal(result.changes.length, 0);
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
    assert.equal(result.changes.length, 1);
    done();
  });
});

QUnit.test('New collaborator enters with a new fast-forward change', function(assert) {
  var done = assert.async();

  collabEngine.sync({
    collaboratorId: 'collab-1',
    documentId: 'test-doc', 
    version: 1,
    change: exampleChange
  }, function(err, result) {
    assert.isNullOrUndefined(err, 'Should not error');
    assert.equal(result.version, 2);
    assert.equal(result.changes.length, 0);
    done();
  });
});

QUnit.test('New collaborator enters with a change that needs rebasing', function(assert) {
  var done = assert.async();

  // We simulate that by letting another user 'collab-2' makeing a text change
  // that affects a later text change of 'collab-1' - the one that needs rebasing.
  var insertTextChange1 = insertText(testDoc, 1, '!');
  var insertTextChange2 = insertText(testDoc, 5, '$$$'); // 5 is based on version 1, after rebasing should be 6

  collabEngine.sync({
    collaboratorId: 'collab-1',
    documentId: 'test-doc', 
    version: 1,
    change: insertTextChange1
  }, function(err, result) {
    assert.isNullOrUndefined(err, 'Should not error');
    assert.equal(result.version, 2);

    collabEngine.sync({
      collaboratorId: 'collab-2',
      documentId: 'test-doc',
      version: 1,
      change: insertTextChange2
    }, function(err, result) {
      assert.isNullOrUndefined(err, 'Should not error');
      assert.equal(result.version, 3);
      assert.equal(result.changes.length, 1);

      assert.notDeepEqual(result.change, insertTextChange2, 'Tranformed change should differ from original change');
      done();
    });    
  });
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
      // var collaborators = collabEngine.getCollaborators('test-doc', 'collab-2');      
      assert.deepEqual(collaboratorIds, ['collab-1'], 'Should return one collaboratorId');
      collaboratorIds = collabEngine.getCollaboratorIds('test-doc', 'collab-1');
      assert.deepEqual(collaboratorIds, ['collab-2'], 'Should return one collaboratorId');
      done();
    });
  });
});

QUnit.test('Collaborator does a fast-forward sync', function(assert) {
  var done = assert.async();

  collabEngine.sync({
    collaboratorId: 'collab-1',
    documentId: 'test-doc', 
    version: 1,
    change: fakeChange
  }, function(err, result) {
    assert.isNullOrUndefined(err, 'Should not error on enter');
    assert.ok(result, 'connect should produce a result object');
    collabEngine.sync({
      collaboratorId: 'collab-1',
      documentId: 'test-doc',
      change: exampleChange,
      version: 1
    }, function(err, syncResult) {
      assert.equal(syncResult.version, 2, 'Version should be 2 after commit');
      assert.deepEqual(syncResult.change, exampleChange, 'Change should be untouched');
      done();
    });
  });
});

QUnit.test('Collaborator does a sync that needs rebasing', function(assert) {
  // We may want to use a proper seed to simulate that scenario
  assert.ok(true, 'TODO: implement');
});
