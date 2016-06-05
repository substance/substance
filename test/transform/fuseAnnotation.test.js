'use strict';

require('../QUnitExtensions');
var fuseAnnotation = require('../../model/transform/fuseAnnotation');
var docHelpers = require('../../model/documentHelpers');
var createTestArticle = require('../fixtures/createTestArticle');
var containerAnnoSample = require('../fixtures/containerAnnoSample');

QUnit.module('model/transform/fuseAnnotation');

function fixture() {
  var doc = createTestArticle(containerAnnoSample);

  // Create a second strong annotation to be fused
  doc.create({
    id: 'a3',
    type: 'strong',
    path: ['p1', 'content'],
    startOffset: 4,
    endOffset: 6
  });

  // Create a second container annotation to be fused
  doc.create({
    type: 'test-container-anno',
    id: 'a4',
    containerId: 'body',
    startPath: ['p3', 'content'],
    startOffset: 7,
    endPath: ['p4', 'content'],
    endOffset: 9,
  });

  return doc;
}


QUnit.test("Fuse of two property annotations for a given property selection", function(assert) {
  var doc = fixture();

  // a2: strong -> p1.content [0..2]
  assert.ok(doc.get('a2'), 'Should have a strong annotation a2 in fixture');

  // Put selection so that it touches both strong annotations
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 1,
    endOffset: 6
  });
  var annos = docHelpers.getPropertyAnnotationsForSelection(doc, sel, { type: 'strong' });

  // Prepare and perform transformation
  var out = fuseAnnotation(doc, { annos: annos });
  var fusedAnno = out.result;

  assert.isNullOrUndefined(doc.get('a2'), 'a2 should be gone.');
  assert.isNullOrUndefined(doc.get('a3'), 'a3 should be gone.');
  assert.ok(fusedAnno, 'fusedAnno should have been returned as a result');

  assert.equal(fusedAnno.startOffset, 0, 'fusedAnno.startOffset should be 0');
  assert.equal(fusedAnno.endOffset, 6, 'fusedAnno.endOffset should be 6');
});

QUnit.test("Fuse of two conatiner annotations for a given property selection", function(assert) {
  var doc = fixture();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p3', 'content'],
    startOffset: 3,
    endOffset: 8
  });
  var annos = docHelpers.getContainerAnnotationsForSelection(doc, sel, 'body', {
    type: 'test-container-anno'
  });
  assert.equal(annos.length, 2, 'There should be two container annotations for this selection.');

  var out = fuseAnnotation(doc, {
    annos: annos
  });
  var fusedAnno = out.result;

  assert.isDefinedAndNotNull(fusedAnno, 'fusedAnno should have been returned as a result of transformation');
  assert.isNullOrUndefined(doc.get('a1'), 'a1 should be gone.');
  assert.isNullOrUndefined(doc.get('a4'), 'a4 should be gone.');

  assert.deepEqual(fusedAnno.startPath, ['p1', 'content'], 'a1.startPath should be p1.content');
  assert.equal(fusedAnno.startOffset, 5, 'fusedAnno.startOffset should be 5');

  assert.deepEqual(fusedAnno.endPath, ['p4', 'content'], 'a1.startPath should be p1.content');
  assert.equal(fusedAnno.endOffset, 9, 'fusedAnno.endOffset should be 9');
});

