'use strict';

require('../qunit_extensions');

var backendSeed = require('../../fixtures/collab/backendSeed');
var MemoryBackend = require('../../../collab/MemoryBackend');
var twoParagraphs = require('../../fixtures/collab/two-paragraphs');
var insertParagraph = require('../../fixtures/collab/insertParagraph');
var MemoryBackend = require('../../../collab/MemoryBackend');
var CollabEngine = require('../../../collab/CollabEngine');

// Equivalent to the 'test-doc' that is in the backendseed.
var testDoc = twoParagraphs.createArticle();

// Example changes should be something that depends on existing content, so we
// properly play the rebase scenario
var exampleChange = insertParagraph(testDoc);

console.log('le exampleChange', exampleChange);

var backend = new MemoryBackend({
  schemas: {
    'prose-article': {
      name: 'prose-article',
      version: '1.0.0',
      documentFactory: twoParagraphs
    }
  }
});

var collabEngine;

QUnit.module('collab/CollabEngine', {
  beforeEach: function(assert) {
    var done = assert.async();

    // Make sure we create a new seed instance, as data ops
    // are performed directly on the seed object
    var newBackendSeed = JSON.parse(JSON.stringify(backendSeed));
    backend.seed(newBackendSeed, function(err) {
      if (err) {
        return console.error(err);
      } else {
        done();
      }
    });
    collabEngine = new CollabEngine(backend);
  }
});

var ENTER_ARGS = {
  collaboratorId: 'collab-1',
  documentId: 'test-doc', 
  version: 1
};

var COMMIT_ARGS = {
  collaboratorId: 'collab-1',
  documentId: 'test-doc',
  change: exampleChange,
  version: 1
};

QUnit.test('New collaborator enters', function(assert) {
  var done = assert.async();

  collabEngine.enter(ENTER_ARGS, function(err, result) {
    assert.isNullOrUndefined(err, 'Should not error');
    assert.equal(result.version, 1);
    assert.equal(result.changes.length, 0);
    // TODO: collabEngine should have one collaborator entry
    done();
  });
});

QUnit.test('New collaborator enters with a new fast-forward change', function(assert) {
  var done = assert.async();
  var enterArgs = Object.assign({}, ENTER_ARGS, {change: exampleChange});

  collabEngine.enter(enterArgs, function(err, result) {
    assert.isNullOrUndefined(err, 'Should not error');
    assert.equal(result.version, 2);
    assert.equal(result.changes.length, 0);
    done();
  });
});


QUnit.test('New collaborator enters with a change that needs rebasing', function(assert) {
  var done = assert.async();
  var enterArgs = Object.assign({}, ENTER_ARGS, {change: exampleChange, version: 0});

  collabEngine.enter(enterArgs, function(err, result) {
    assert.isNullOrUndefined(err, 'Should not error');
    assert.equal(result.version, 2);
    assert.equal(result.changes.length, 1);
    // TODO: we need a change that actually has to be transformed in a rebase scenario
    // assert.notDeepEqual(result.change, exampleChange, 'Change should have been rebased');
    done();
  });
});

QUnit.test('Collaborator does a fast-forward commit', function(assert) {
  var done = assert.async();

  collabEngine.enter(ENTER_ARGS, function(err, result) {
    assert.isNullOrUndefined(err, 'Should not error on enter');
    assert.ok(result, 'enter should produce a result object');
    collabEngine.commit(COMMIT_ARGS, function(err, commitResult) {
      assert.equal(commitResult.version, 2, 'Version should be 2 after commit');
      assert.deepEqual(commitResult.change, COMMIT_ARGS.change, 'Change should be untouched');
      done();
    });
  });
});

