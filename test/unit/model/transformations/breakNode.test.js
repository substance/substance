"use strict";

require('../../qunit_extensions');
var sample1 = require('../../../fixtures/sample1');
var breakNode = require('../../../../model/transform/breakNode');

QUnit.module('model/transform/breakNode');

QUnit.test("Breaking a paragraph", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 4
  });
  var args = {selection: sel, containerId: 'main'};
  var out = breakNode(doc, args);
  var newNodeId = out.node.id;
  var selection = out.selection;
  assert.equal(doc.get(['p1', 'content']), 'Para', 'Content of p2 should be truncated.');
  assert.equal(doc.get([newNodeId, 'content']), 'graph 1', 'Remaining content should be inserted into new paragraph.');
  assert.ok(selection.isCollapsed(), 'Selection should be collapsed afterwards.');
  assert.deepEqual(selection.path, [newNodeId, 'content'], 'Selection should be in new line.');
  assert.equal(selection.startOffset, 0, 'Selection should be at begin of line.');
});

QUnit.test("Breaking a paragraph with expanded property selection", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 4,
    endOffset: 10,
  });
  var args = {selection: sel, containerId: 'main'};
  var out = breakNode(doc, args);
  var newNodeId = out.node.id;
  var selection = out.selection;
  assert.equal(doc.get(['p1', 'content']), 'Para', 'Content of p2 should be truncated.');
  assert.equal(doc.get([newNodeId, 'content']), '1', 'Remaining content should be inserted into new paragraph.');
  assert.ok(selection.isCollapsed(), 'Selection should be collapsed afterwards.');
  assert.deepEqual(selection.path, [newNodeId, 'content'], 'Selection should be in new line.');
  assert.equal(selection.startOffset, 0, 'Selection should be at begin of line.');
});

QUnit.test("Breaking a paragraph with expanded container selection", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 4,
    endPath: ['p2', 'content'],
    endOffset: 4,
  });
  var args = {selection: sel, containerId: 'main'};
  var out = breakNode(doc, args);
  var newNodeId = out.node.id;
  var selection = out.selection;
  assert.equal(doc.get(['p1', 'content']), 'Para', 'Content of p2 should be truncated.');
  assert.equal(doc.get([newNodeId, 'content']), 'graph with annotation', 'Remaining content should be in new paragraph.');
  assert.ok(selection.isCollapsed(), 'Selection should be collapsed afterwards.');
  assert.deepEqual(selection.path, [newNodeId, 'content'], 'Selection should be in new line.');
  assert.equal(selection.startOffset, 0, 'Selection should be at begin of line.');
});


QUnit.test("Breaking a paragraph before annotation", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 4
  });
  var args = {selection: sel, containerId: 'main'};
  var out = breakNode(doc, args);
  var newNodeId = out.node.id;
  var anno = doc.get('em1');
  var annoIndex = doc.getIndex('annotations');
  var oldAnnos = annoIndex.get(['p2', 'content']);
  assert.equal(doc.get([newNodeId, 'content']), 'graph with annotation', 'Remaining content should be inserted into new paragraph.');
  assert.deepEqual(anno.path, [newNodeId, 'content'], "Annotation should have been transferred to new node.");
  assert.deepEqual([anno.startOffset, anno.endOffset], [11, 21], "Annotation should have been located correctly.");
  assert.isEmpty(oldAnnos, "No annotations should be left on the original node.");
});

QUnit.test("Breaking a paragraph inside an annotation", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 20
  });
  var args = {selection: sel, containerId: 'main'};
  var out = breakNode(doc, args);
  var newNodeId = out.node.id;
  var annoIndex = doc.getIndex('annotations');
  var oldAnnos = annoIndex.get(['p2', 'content']);
  var newAnnos = annoIndex.get([newNodeId, 'content']);
  assert.equal(oldAnnos.length, 1, 'There should be one annotation left on the old node.');
  assert.equal(newAnnos.length, 1, 'And there should be a split off on the new node.');
  var annoPart1 = oldAnnos[0];
  var annoPart2 = newAnnos[0];
  assert.deepEqual([annoPart1.startOffset, annoPart1.endOffset], [15, 20], "Original annotation should have been truncated.");
  assert.deepEqual([annoPart2.startOffset, annoPart2.endOffset], [0, 5], "New annotation at the begin of the new property.");
});
