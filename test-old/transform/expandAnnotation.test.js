'use strict';

require('../QUnitExtensions');
var expandAnnotation = require('../../model/transform/expandAnnotation');
var documentHelpers = require('../../model/documentHelpers');

var fixture = require('../fixtures/createTestArticle');
var containerAnnoSample = require('../fixtures/containerAnnoSample');

QUnit.module('model/transform/expandAnnotation');

QUnit.test("Expand-right of property annotation for a given property selection", function(assert) {
  var doc = fixture(containerAnnoSample);
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 1,
    endOffset: 6
  });
  var annos = documentHelpers.getPropertyAnnotationsForSelection(doc, sel, {
    type: 'strong'
  });
  assert.equal(annos.length, 1, 'There should be one strong annotation in the fixture');
  var out = expandAnnotation(doc, {
    selection: sel,
    anno: annos[0]
  });
  var a2 = out.result;

  assert.isDefinedAndNotNull(a2, 'a2 should have been returned as a result');
  assert.equal(a2.startOffset, 0, 'a2.startOffset should be 0');
  assert.equal(a2.endOffset, 6, 'a2.endOffset should have changed from 2 to 1');
});

QUnit.test("Expand container annotation for a given property selection (right expansion)", function(assert) {
  var doc = fixture(containerAnnoSample);

  var sel = doc.createSelection({
    type: 'property',
    path: ['p3', 'content'],
    startOffset: 1,
    endOffset: 6
  });
  var anno = doc.get('a1');
  assert.isDefinedAndNotNull(anno, 'There should be container annotation "a1" in the fixture');
  var out = expandAnnotation(doc, {
    selection: sel,
    anno: anno
  });
  var a1 = out.result;

  assert.ok(a1, 'a1 should have been returned as a result');
  assert.equal(a1.endOffset, 6, 'a1.endOffset should be 6');
});

QUnit.test("Expand container annotation for a given container selection (expand right)", function(assert) {
  var doc = fixture(containerAnnoSample);

  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p2', 'content'],
    startOffset: 1,
    endPath: ['p3', 'content'],
    endOffset: 6,
  });
  var anno = doc.get('a1');
  assert.isDefinedAndNotNull(anno, 'There should be container annotation "a1" in the fixture');
  var out = expandAnnotation(doc, {
    selection: sel,
    anno: anno
  });
  var a1 = out.result;

  assert.ok(a1, 'a1 should have been returned as a result');
  assert.deepEqual(a1.endPath, ['p3', 'content'], 'a1.endPath should be p2.content');
  assert.equal(a1.endOffset, 6, 'a1.endOffset should be 6');
});
