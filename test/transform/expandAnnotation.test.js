'use strict';

var test = require('../test').module('transform/expandAnnotation');

var expandAnnotation = require('../../model/transform/expandAnnotation');
var documentHelpers = require('../../model/documentHelpers');

var fixture = require('../fixtures/createTestArticle');
var containerAnnoSample = require('../fixtures/containerAnnoSample');

test("Expand-right of property annotation for a given property selection", function(t) {
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
  t.equal(annos.length, 1, 'There should be one strong annotation in the fixture');
  var out = expandAnnotation(doc, {
    selection: sel,
    anno: annos[0]
  });
  var a2 = out.result;

  t.notNil(a2, 'a2 should have been returned as a result');
  t.equal(a2.startOffset, 0, 'a2.startOffset should be 0');
  t.equal(a2.endOffset, 6, 'a2.endOffset should have changed from 2 to 1');
  t.end();
});

test("Expand container annotation for a given property selection (right expansion)", function(t) {
  var doc = fixture(containerAnnoSample);

  var sel = doc.createSelection({
    type: 'property',
    path: ['p3', 'content'],
    startOffset: 1,
    endOffset: 6
  });
  var anno = doc.get('a1');
  t.notNil(anno, 'There should be container annotation "a1" in the fixture');
  var out = expandAnnotation(doc, {
    selection: sel,
    anno: anno
  });
  var a1 = out.result;

  t.ok(a1, 'a1 should have been returned as a result');
  t.equal(a1.endOffset, 6, 'a1.endOffset should be 6');
  t.end();
});

test("Expand container annotation for a given container selection (expand right)", function(t) {
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
  t.notNil(anno, 'There should be container annotation "a1" in the fixture');
  var out = expandAnnotation(doc, {
    selection: sel,
    anno: anno
  });
  var a1 = out.result;

  t.ok(a1, 'a1 should have been returned as a result');
  t.deepEqual(a1.endPath, ['p3', 'content'], 'a1.endPath should be p2.content');
  t.equal(a1.endOffset, 6, 'a1.endOffset should be 6');
  t.end();
});
