'use strict';

var containerAnnoSample = require('../../fixtures/container_anno_sample');
var deleteAnnotation = require('../../../model/transformations/deleteAnnotation');

QUnit.module('Transformations/deleteAnnotation');

QUnit.test("Delete property annotation for a given property selection", function(assert) {
  var doc = containerAnnoSample();

  // a2: strong -> p1.content [0..2]
  assert.ok(doc.get('a2'), 'Should have a strong annotation a2 in fixture');

  // Put cursor inside an the existing annotation
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 1
  });

  // Prepare and perform transformation
  var args = {selection: sel, containerId: 'main', annotationType: 'strong'};
  var out = deleteAnnotation(doc, args);

  var deletedAnnoId = out.result;
  assert.equal(deletedAnnoId, 'a2', 'a2 should have been deleted');
  assert.isNullOrUndefined(doc.get('a2'), 'a2 should be gone.');
});

QUnit.test("Delete container annotation for a given selection", function(assert) {
  var doc = containerAnnoSample();

  assert.ok(doc.get('a1'), 'Should have a container annotation a1 in fixture');

  // Put cursor inside an the container anno
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 0
  });

  // Prepare and perform transformation
  var args = {selection: sel, containerId: 'main', annotationType: 'test-container-anno'};
  var out = deleteAnnotation(doc, args);

  var deletedAnnoId = out.result;
  assert.equal(deletedAnnoId, 'a1', 'a1 should have been deleted');
  assert.isNullOrUndefined(doc.get('a1'), 'a1 should be gone.');
});

QUnit.test("Delete container annotation for a given container selection", function(assert) {
  var doc = containerAnnoSample();

  assert.ok(doc.get('a1'), 'Should have a container annotation a1 in fixture');


  // Selected text 'Paragraph' in p1
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p2', 'content'],
    startOffset: 0,
    endPath: ['p3', 'content'],
    endOffset: 2,
  });

  // Prepare and perform transformation
  var args = {selection: sel, containerId: 'main', annotationType: 'test-container-anno'};
  var out = deleteAnnotation(doc, args);

  var deletedAnnoId = out.result;
  assert.equal(deletedAnnoId, 'a1', 'a1 should have been deleted');
  assert.isNullOrUndefined(doc.get('a1'), 'a1 should be gone.');
});
