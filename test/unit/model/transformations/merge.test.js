"use strict";
require('../../qunit_extensions');

var sample1 = require('../../../fixtures/sample1');
var merge = require('../../../../model/transform/merge');

QUnit.module('model/transform/merge');

QUnit.test("Merging two paragraphs", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 0
  });
  var args = {selection: sel, containerId: 'main', path: ['p2', 'content'], direction: 'left'};
  var out = merge(doc, args);
  var selection = out.selection;
  assert.equal(doc.get(['h2', 'content']), 'Section 2Paragraph with annotation', 'Content of p2 should have been merged into h2.');
  assert.isNullOrUndefined(doc.get('p2'), 'p2 should be gone.');
  var anno = doc.get('em1');
  assert.deepEqual(anno.path, ['h2', 'content'], 'Annotation should have been transferred to h2.');
  assert.deepEqual([anno.startOffset, anno.endOffset], [24, 34], 'Annotation should have been placed correctly.');
  assert.ok(selection.isCollapsed(), 'Selection should be collapsed.');
  assert.equal(selection.startOffset, 9, 'Cursor should be before the first character of the merged text.');
});
