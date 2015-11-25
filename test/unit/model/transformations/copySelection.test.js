"use strict";

require('../../qunit_extensions');
var sample1 = require('../../../fixtures/sample1');
var copySelection = require('../../../../model/transform/copySelection');
var CLIPBOARD_PROPERTY_ID = copySelection.CLIPBOARD_PROPERTY_ID;

QUnit.module('model/transform/copySelection');

QUnit.test("Copying a property selection", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 4,
    endOffset: 9
  });
  var args = {selection: sel};
  var out = copySelection(doc, args);
  var copy = out.doc;
  var textNode = copy.get(CLIPBOARD_PROPERTY_ID);
  assert.isDefinedAndNotNull(textNode, 'There should be a text node for the property fragment.');
  assert.equal(textNode.content, 'graph', 'Selected text should be copied.');
});

QUnit.test("Copying a property selection with annotated text", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 10,
    endOffset: 19
  });
  var args = {selection: sel};
  var out = copySelection(doc, args);
  var copy = out.doc;
  assert.equal(copy.get([CLIPBOARD_PROPERTY_ID, 'content']), 'with anno', 'Selected text should be copied.');
  var annos = copy.getIndex('annotations').get([CLIPBOARD_PROPERTY_ID, 'content']);
  assert.equal(annos.length, 1, 'There should be one annotation on copied text.');
  var anno = annos[0];
  assert.equal(anno.type, "emphasis", "The annotation should be 'emphasis'.");
  assert.deepEqual([anno.startOffset, anno.endOffset], [5, 9], 'The annotation should be over the text "anno".');
});

QUnit.test("Copying a container selection", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['h1', 'content'],
    startOffset: 4,
    endPath: ['p2', 'content'],
    endOffset: 9
  });
  var args = {selection: sel};
  var out = copySelection(doc, args);
  var copy = out.doc;
  var content = copy.get('clipboard_content');
  assert.isDefinedAndNotNull(content, 'There should be a container node with id "content".');
  assert.equal(content.nodes.length, 4, 'There should be 4 nodes in the copied document.');
  var first = copy.get(content.nodes[0]);
  assert.equal(first.type, 'heading', "The first node should be a heading.");
  assert.equal(first.content, 'ion 1', "Its content should be truncated to 'ion 1'.");
  var last = copy.get(content.nodes[3]);
  assert.equal(last.type, 'paragraph', "The last node should be a paragraph.");
  assert.equal(last.content, 'Paragraph', "Its content should be truncated to 'Paragraph'.");
});
