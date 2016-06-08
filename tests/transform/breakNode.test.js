"use strict";

var test = require('../test');

var breakNode = require('../../model/transform/breakNode');

var isEmpty = require('lodash/isEmpty');

var fixture = require('../fixtures/createTestArticle');
var simple = require('../fixtures/simple');
var headersAndParagraphs = require('../fixtures/headersAndParagraphs');

test("Breaking a paragraph", function(t) {
  var doc = fixture(simple);
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 4
  });
  var args = {selection: sel, containerId: 'body'};
  var out = breakNode(doc, args);
  var newNodeId = out.node.id;
  var selection = out.selection;
  t.equal(doc.get(['p1', 'content']), '0123', 'Content of p2 should be truncated.');
  t.equal(doc.get([newNodeId, 'content']), '456789', 'Remaining content should be inserted into new paragraph.');
  t.ok(selection.isCollapsed(), 'Selection should be collapsed afterwards.');
  t.deepEqual(selection.path, [newNodeId, 'content'], 'Selection should be in new line.');
  t.equal(selection.startOffset, 0, 'Selection should be at begin of line.');
  t.end();
});

test("Breaking a paragraph with expanded property selection", function(t) {
  var doc = fixture(headersAndParagraphs);
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 4,
    endOffset: 10,
  });
  var args = {selection: sel, containerId: 'body'};
  var out = breakNode(doc, args);
  var newNodeId = out.node.id;
  var selection = out.selection;
  t.equal(doc.get(['p1', 'content']), 'Para', 'Content of p2 should be truncated.');
  t.equal(doc.get([newNodeId, 'content']), '1', 'Remaining content should be inserted into new paragraph.');
  t.ok(selection.isCollapsed(), 'Selection should be collapsed afterwards.');
  t.deepEqual(selection.path, [newNodeId, 'content'], 'Selection should be in new line.');
  t.equal(selection.startOffset, 0, 'Selection should be at begin of line.');
  t.end();
});

test("Breaking a paragraph with expanded container selection", function(t) {
  var doc = fixture(headersAndParagraphs);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 4,
    endPath: ['p2', 'content'],
    endOffset: 4,
  });
  var args = {selection: sel, containerId: 'body'};
  var out = breakNode(doc, args);
  var newNodeId = out.node.id;
  var selection = out.selection;
  t.equal(doc.get(['p1', 'content']), 'Para', 'Content of p2 should be truncated.');
  t.equal(doc.get([newNodeId, 'content']), 'graph with annotation', 'Remaining content should be in new paragraph.');
  t.ok(selection.isCollapsed(), 'Selection should be collapsed afterwards.');
  t.deepEqual(selection.path, [newNodeId, 'content'], 'Selection should be in new line.');
  t.equal(selection.startOffset, 0, 'Selection should be at begin of line.');
  t.end();
});


test("Breaking a paragraph before annotation", function(t) {
  var doc = fixture(headersAndParagraphs);
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 4
  });
  var args = {selection: sel, containerId: 'body'};
  var out = breakNode(doc, args);
  var newNodeId = out.node.id;
  var anno = doc.get('em1');
  var annoIndex = doc.getIndex('annotations');
  var oldAnnos = annoIndex.get(['p2', 'content']);
  t.equal(doc.get([newNodeId, 'content']), 'graph with annotation', 'Remaining content should be inserted into new paragraph.');
  t.deepEqual(anno.path, [newNodeId, 'content'], "Annotation should have been transferred to new node.");
  t.deepEqual([anno.startOffset, anno.endOffset], [11, 21], "Annotation should have been located correctly.");
  t.ok(isEmpty(oldAnnos), "No annotations should be left on the original node.");
  t.end();
});

test("Breaking a paragraph inside an annotation", function(t) {
  var doc = fixture(headersAndParagraphs);
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 20
  });
  var args = {selection: sel, containerId: 'body'};
  var out = breakNode(doc, args);
  var newNodeId = out.node.id;
  var annoIndex = doc.getIndex('annotations');
  var oldAnnos = annoIndex.get(['p2', 'content']);
  var newAnnos = annoIndex.get([newNodeId, 'content']);
  t.equal(oldAnnos.length, 1, 'There should be one annotation left on the old node.');
  t.equal(newAnnos.length, 1, 'And there should be a split off on the new node.');
  var annoPart1 = oldAnnos[0];
  var annoPart2 = newAnnos[0];
  t.deepEqual([annoPart1.startOffset, annoPart1.endOffset], [15, 20], "Original annotation should have been truncated.");
  t.deepEqual([annoPart2.startOffset, annoPart2.endOffset], [0, 5], "New annotation at the begin of the new property.");
  t.end();
});
