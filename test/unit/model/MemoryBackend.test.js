'use strict';

require('../qunit_extensions');

var backendSeed = require('../../fixtures/collab/backendSeed');
var MemoryBackend = require('../../../collab/MemoryBackend');
var runBackendTests = require('../../collab/runBackendTests');
var twoParagraphs = require('../../fixtures/collab/two-paragraphs');

var backend = new MemoryBackend({
  schemas: {
    'prose-article': {
      name: 'prose-article',
      version: '1.0.0',
      documentFactory: twoParagraphs
    }
  }
});

QUnit.module('collab/MemoryBackend', {
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
  }
});

// Runs the offical backend test suite
runBackendTests(backend, QUnit);