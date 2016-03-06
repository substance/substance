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
var exampleChange = insertParagraph(testDoc);

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

var enterArgs = {
  collaboratorId: 'collab-1',
  documentId: 'test-doc', 
  version: 1
};

var commitArgs = {
  collaboratorId: 'collab-1',
  documentId: 'test-doc',
  change: exampleChange,
  version: 1
};

QUnit.test('New collaborator enters', function(assert) {
  var done = assert.async();

  collabEngine.enter(enterArgs, function(err, result) {
    assert.isNullOrUndefined(err, 'Should not error');
    assert.equal(result.version, 1);
    assert.equal(result.changes.length, 0);
    // TODO: collabEngine should have one collaborator entry
    done();
  });
});

QUnit.test('New collaborator enters with a new fast-forward change', function(assert) {
  assert.ok(true, 'TODO: Implement test');
});

QUnit.test('New collaborator enters with a change that needs rebasing', function(assert) {
  assert.ok(true, 'TODO: Implement test');
});

QUnit.test('Collaborator does a fast-forward commit', function(assert) {
  var done = assert.async();
  var args = {collaboratorId: 'collab-1', documentId: 'test-doc', version: 1};

  collabEngine.enter(enterArgs, function(err, result) {
    collabEngine.commit(commitArgs, function(err, result) {
      console.log('commit result', result);
    });
  });
});

