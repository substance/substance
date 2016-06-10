"use strict";

var test = require('../test').module('transform/merge');

var merge = require('../../model/transform/merge');

var fixture = require('../fixtures/createTestArticle');
var headersAndParagraphs = require('../fixtures/headersAndParagraphs');

var isNull = require('lodash/isNull');
var isUndefined = require('lodash/isUndefined');

function isNullOrUndefined(t, x, msg) {
  return t.ok(isNull(x) || isUndefined(x), msg);
}

test("Merging two paragraphs", function(t) {
  var doc = fixture(headersAndParagraphs);
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 0
  });
  var args = {selection: sel, containerId: 'body', path: ['p2', 'content'], direction: 'left'};
  var out = merge(doc, args);
  var selection = out.selection;
  t.equal(doc.get(['h2', 'content']), 'Section 2Paragraph with annotation', 'Content of p2 should have been merged into h2.');
  isNullOrUndefined(t, doc.get('p2'), 'p2 should be gone.');
  var anno = doc.get('em1');
  t.deepEqual(anno.path, ['h2', 'content'], 'Annotation should have been transferred to h2.');
  t.deepEqual([anno.startOffset, anno.endOffset], [24, 34], 'Annotation should have been placed correctly.');
  t.ok(selection.isCollapsed(), 'Selection should be collapsed.');
  t.equal(selection.startOffset, 9, 'Cursor should be before the first character of the merged text.');
  t.end();
});
