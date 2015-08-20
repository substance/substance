'use strict';

require('../qunit_extensions');
var sample = require('../../fixtures/container_anno_sample');

QUnit.module('Unit/Substance.Document/ContainerAnnotationIndex');

QUnit.test("Should index loaded container annotations", function(assert) {
  var doc = sample();
  var index = doc.containerAnnotationIndex;
  var annos = index.getAllContainerAnnotations();
  assert.isDefinedAndNotNull(annos['a1'], "TestContainerAnnotation should be indexed.");
});

QUnit.test("Should index loaded container annotations", function(assert) {
  var doc = sample();
  var index = doc.containerAnnotationIndex;
  var frags = index.getFragments(['p1', 'content'], 'main');
  assert.equal(frags.length, 1, "There should be one fragment on p1");
  frags = index.getFragments(['p2', 'content'], 'main');
  assert.equal(frags.length, 1, "There should be one fragment on p2");
  frags = index.getFragments(['p3', 'content'], 'main');
  assert.equal(frags.length, 1, "There should be one fragment on p3");
});

QUnit.test("Should index dynamically created annotations", function(assert) {
  var doc = sample();
  var index = doc.containerAnnotationIndex;
  // ATTENTION: we need to use transactions here because ContainerAnnotationIndex
  // is updated after transaction
  doc.transaction(function(tx) {
    tx.create({
      type: 'test-container-anno',
      id: 'a2',
      container: 'main',
      startPath: ['p3', 'content'],
      startOffset: 1,
      endPath: ['p4', 'content'],
      endOffset: 3,
    });
  });
  var frags = index.getFragments(['p3', 'content'], 'main');
  assert.equal(frags.length, 2, "There should be 2 fragments on p3");
  frags = index.getFragments(['p4', 'content'], 'main');
  assert.equal(frags.length, 1, "There should be one fragment on p4");
});

QUnit.test("Should index dynamically created annotation which is only on one property", function(assert) {
  var doc = sample();
  var index = doc.containerAnnotationIndex;
  // ATTENTION: we need to use transactions here because ContainerAnnotationIndex
  // is updated after transaction
  doc.transaction(function(tx) {
    tx.create({
      type: 'test-container-anno',
      id: 'a2',
      container: 'main',
      startPath: ['p4', 'content'],
      startOffset: 1,
      endPath: ['p4', 'content'],
      endOffset: 3,
    });
  });
  var frags = index.getFragments(['p4', 'content'], 'main');
  assert.equal(frags.length, 1, "There should be one fragment on p4");
});

QUnit.test("Index should be up2date before other change listeners get called", function(assert) {
  var doc = sample();
  var index = doc.containerAnnotationIndex;
  var called = false;
  // this should be called after the container annotation index has been updated
  function handler() {
    var frags = index.getFragments(['p4', 'content'], 'main');
    assert.equal(frags.length, 1, "There should be one fragment on p4");
    called = true;
  }
  doc.getEventProxy('path').add(['p4', 'content'], null, handler);
  doc.transaction(function(tx) {
    tx.create({
      type: 'test-container-anno',
      id: 'a2',
      container: 'main',
      startPath: ['p4', 'content'],
      startOffset: 1,
      endPath: ['p4', 'content'],
      endOffset: 3,
    });
  });
  assert.ok(called, "Handler should have been called.");
});
