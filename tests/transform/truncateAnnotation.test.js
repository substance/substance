'use strict';

var test = require('../test');

var truncateAnnotation = require('../../model/transform/truncateAnnotation');

var fixture = require('../fixtures/createTestArticle');
var containerAnnoSample = require('../fixtures/containerAnnoSample');

var isNull = require('lodash/isNull');
var isUndefined = require('lodash/isUndefined');

function isDefinedAndNotNull(t, x, msg) {
  return t.ok(!isNull(x) && !isUndefined(x), msg);
}

test("Truncate property annotation with a given property selection", function(t) {
  var doc = fixture(containerAnnoSample);
  // Put cursor inside an the existing annotation
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 1,
    endOffset: 2
  });
  var anno = doc.get('a2');
  isDefinedAndNotNull(t, anno, 'There should be "a2" in the fixture');

  var out = truncateAnnotation(doc, {
    anno: anno,
    selection: sel
  });
  var a2 = out.result;

  t.ok(a2, 'a2', 'a2 should have been returned as a result');
  t.equal(a2.startOffset, 0, 'a2.startOffset should be 0');
  t.equal(a2.endOffset, 1, 'a2.endOffset should have changed from 2 to 1');
  t.end();
});

test("Truncate container annotation with a given property selection", function(t) {
  var doc = fixture(containerAnnoSample);

  var sel = doc.createSelection({
    type: 'property',
    path: ['p3', 'content'],
    startOffset: 1,
    endOffset: 4
  });
  var anno = doc.get('a1');
  isDefinedAndNotNull(t, anno, 'There should be "a1" in the fixture');

  var out = truncateAnnotation(doc, {
    anno: anno,
    selection: sel
  });
  var a1 = out.result;

  t.ok(a1, 'a1', 'a1 should have been returned as a result');
  t.equal(a1.endOffset, 1, 'a1.endOffset should be 1');
  t.end();
});

test("Truncate container annotation with a given container selection", function(t) {
  var doc = fixture(containerAnnoSample);

  t.ok(doc.get('a1'), 'Should have a container annotation a1 in fixture');
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p2', 'content'],
    startOffset: 1,
    endPath: ['p3', 'content'],
    endOffset: 4,
  });
  var anno = doc.get('a1');
  isDefinedAndNotNull(t, anno, 'There should be "a1" in the fixture');

  var out = truncateAnnotation(doc, {
    anno: anno,
    selection: sel
  });
  var a1 = out.result;

  t.ok(a1, 'a1', 'a1 should have been returned as a result');
  t.deepEqual(a1.endPath, ['p2', 'content'], 'a1.endPath should be p2.content');
  t.equal(a1.endOffset, 1, 'a1.endOffset should be 1');
  t.end();
});
