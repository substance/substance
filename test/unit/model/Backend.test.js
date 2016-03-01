'use strict';

require('../qunit_extensions');

var backendSeed = require('../../fixtures/collab/backendSeed');
var TestBackend = require('../../collab/TestBackend');
var runBackendTests = require('../../collab/runBackendTests');

var backend = new TestBackend({
  ArticleClass: require('../../../packages/prose-editor/ProseArticle')
});

QUnit.module('collab/Backend', {
  beforeEach: function(assert) {
    var done = assert.async();
    backend.seed(backendSeed, function(err) {
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