"use strict";

require('../QUnitExtensions');
var deleteSelection = require('../../model/transform/deleteSelection');

var fixture = require('../fixtures/createTestArticle');
var simple = require('../fixtures/simple');
var headersAndParagraphs = require('../fixtures/headersAndParagraphs');
var containerAnnoSample = require('../fixtures/containerAnnoSample');

QUnit.module('model/transform/deleteSelection');

QUnit.test("Deleting a property selection", function(assert) {
  var doc = fixture(headersAndParagraphs);
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 10,
    endOffset: 15
  });
  var args = {selection: sel};
  args = deleteSelection(doc, args);
  assert.equal(doc.get(['p2', 'content']), 'Paragraph annotation', 'Selected text should be deleted.');
  assert.equal(args.selection.start.offset, 10, 'Selection should be collapsed to the left');
});

QUnit.test("Deleting a property selection before annotation", function(assert) {
  var doc = fixture(headersAndParagraphs);
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 0,
    endOffset: 4
  });
  var anno = doc.get('em1');
  var oldStartOffset = anno.startOffset;
  var oldEndOffset = anno.endOffset;
  var args = {selection: sel};
  deleteSelection(doc, args);
  assert.equal(anno.startOffset, oldStartOffset-4, 'Annotation start should be shifted left.');
  assert.equal(anno.endOffset, oldEndOffset-4, 'Annotation end should be shifted left.');
});

QUnit.test("Deleting a property selection overlapping annotation start", function(assert) {
  var doc = fixture(headersAndParagraphs);
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 10,
    endOffset: 20
  });
  var anno = doc.get('em1');
  var args = {selection: sel};
  deleteSelection(doc, args);
  assert.equal(anno.startOffset, 10, 'Annotation start should be shifted left.');
  assert.equal(anno.endOffset, 15, 'Annotation end should be shifted left.');
});

QUnit.test("Deleting a property selection overlapping annotation end", function(assert) {
  var doc = fixture(headersAndParagraphs);
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 20,
    endOffset: 30
  });
  var anno = doc.get('em1');
  var args = {selection: sel};
  deleteSelection(doc, args);
  assert.equal(anno.startOffset, 15, 'Annotation start should not change.');
  assert.equal(anno.endOffset, 20, 'Annotation end should be shifted left.');
});

QUnit.test("Deleting a container selection", function(assert) {
  var doc = fixture(headersAndParagraphs);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['h2', 'content'],
    startOffset: 8,
    endPath: ['p2', 'content'],
    endOffset: 10
  });
  var args = {selection: sel, containerId: 'body'};
  var out = deleteSelection(doc, args);
  var selection = out.selection;
  var anno = doc.get('em1');
  assert.equal(doc.get(['h2', 'content']), "Section with annotation", "Rebodying content of p2 should get appended to rebodys of h2");
  assert.ok(selection.isCollapsed(), 'Selection should be collapsed afterwards.');
  assert.deepEqual(selection.path, ['h2', 'content'], 'Cursor should be in h2.');
  assert.equal(selection.startOffset, 8, 'Cursor should be at the end of h2s rebodys');
  assert.deepEqual(anno.path, ['h2', 'content'], 'Annotation should have been transferred to h2.');
  assert.deepEqual([anno.startOffset, anno.endOffset], [13, 23], 'Annotation should have been placed correctly.');
});

QUnit.test("Deleting a paragraph", function(assert) {
  var doc = fixture(headersAndParagraphs);
  var body = doc.get('body');
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1'],
    startOffset: 0,
    endPath: ['p1'],
    endOffset: 1
  });
  var args = {selection: sel, containerId: 'body'};
  deleteSelection(doc, args);
  assert.isNullOrUndefined(doc.get('p1'), 'Paragraph should be deleted ...');
  assert.equal(body.nodes.indexOf('p1'), -1, '... and hidden.');
});

QUnit.test("Deleting all", function(assert) {
  var doc = fixture(headersAndParagraphs);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['h1', 'content'],
    startOffset: 0,
    endPath: ['p3', 'content'],
    endOffset: 11
  });
  var args = { selection: sel, containerId: 'body' };
  var out = deleteSelection(doc, args);
  // there should be an empty paragraph now
  var container = doc.get('body');
  assert.equal(container.nodes.length, 1, "There should be one empty paragraph");
  var first = container.getChildAt(0);
  var defaultTextType = doc.getSchema().getDefaultTextType();
  assert.equal(first.type, defaultTextType, "Node should be a default text node");
  var address = container.getAddress(out.selection.start);
  assert.ok(out.selection.isCollapsed(), "Selection should be collapsed (Cursor).");
  assert.equal(address.toString(), '0.0', "Cursor should be at very first position.");
});

function addStructuredNode(doc) {
  var structuredNode = doc.create({
    id: "sn1",
    type: "structured-node",
    title: "0123456789",
    body: "0123456789",
    caption: "0123456789"
  });
  doc.get('body').show(structuredNode.id, 1);
  return structuredNode;
}

QUnit.test("Trying to delete a structured node partially", function(assert) {
  // Node we decided not to allow container selections which select
  // structured nodes partially. This test is a reminiscence to that old implementation.
  var doc = fixture(simple);
  var structuredNode = addStructuredNode(doc);
  // this selection is not 'valid' (TODO: add documentation and link here)
  // and is turned into a selection which spans over the whole node
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 0,
    endPath: [structuredNode.id, 'body'],
    endOffset: 5
  });
  var args = { selection: sel, containerId: 'body' };
  var out = deleteSelection(doc, args);
  var container = doc.get('body');
  assert.isNullOrUndefined(doc.get('p1'), 'p1 should have been deleted');
  assert.isNullOrUndefined(doc.get('sn1'), 'sn1 should have been deleted');
  // Check selection
  assert.ok(out.selection.isCollapsed(), "Selection should be collapsed (Cursor).");
  var address = container.getAddress(out.selection.start);
  assert.equal(address.toString(), '0.0', "Cursor should be in empty text node.");
  assert.equal(out.selection.start.offset, 0, "Cursor should be at first position.");
});

QUnit.test("Deleting a structured node and merge surrounding context", function(assert) {
  var doc = fixture(headersAndParagraphs);
  addStructuredNode(doc);

  // structured node sits betweeen h1 and p1
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['h1', 'content'],
    startOffset: 4,
    endPath: ['p1', 'content'],
    endOffset: 4
  });

  var args = { selection: sel, containerId: 'body' };
  deleteSelection(doc, args);
  var containerNodes = doc.get(['body', 'nodes']);
  assert.deepEqual(containerNodes, ["h1", "h2", "p2", "h3", "p3"], 'sn and p1 should have been deleted from the container');
  var h1 = doc.get('h1');

  assert.notOk(doc.get('sn'), 'Structured node should have been deleted');
  assert.equal(h1.content, 'Sectgraph 1', 'h1 should have been joined with the rebodying contents of p1');
});

function addImage(doc) {
  // This node does not have any editable properties
  var imageNode = doc.create({
    id: "img1",
    type: "image",
    src: "img1.png",
    previewSrc: "img1thumb.png",
  });
  doc.get('body').show(imageNode.id, 1);
  return imageNode;
}

QUnit.test("Delete a node without editable properties", function(assert) {
  var doc = fixture(headersAndParagraphs);

  // this adds an image node between h1 and p1
  addImage(doc);

  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['h1', 'content'],
    startOffset: 4,
    endPath: ['p1', 'content'],
    endOffset: 4
  });

  var args = { selection: sel, containerId: 'body' };
  deleteSelection(doc, args);
  var containerNodes = doc.get(['body', 'nodes']);
  assert.deepEqual(containerNodes, ["h1", "h2", "p2", "h3", "p3"], 'sn and p1 should have been deleted from the container');
  var h1 = doc.get('h1');

  assert.notOk(doc.get('img1'), 'Structured node should have been deleted');
  assert.equal(h1.content, 'Sectgraph 1', 'h1 should have been joined with the rebodying contents of p1');
});

QUnit.test("Edge case: delete container selection spanning multiple nodes containing container annotations", function(assert) {
  // the annotation spans over three nodes
  // we start the selection within the anno in the first text node
  // and expand to the end of the third node
  var doc = fixture(containerAnnoSample);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 7,
    endPath: ['p3', 'content'],
    endOffset: 10
  });
  var args = { selection: sel, containerId: 'body' };
  var out = deleteSelection(doc, args);
  var selection = out.selection;
  var a1 = doc.get('a1');
  assert.equal(doc.get(['p1', 'content']), "0123456", "Rebodying content of p1 should be truncated.");
  assert.ok(selection.isCollapsed(), 'Selection should be collapsed afterwards.');
  assert.deepEqual(a1.endPath, ['p1', 'content'], "Container annotation should be truncated");
  assert.equal(a1.endOffset, 7, "Container annotation should be truncated");
});


QUnit.test("Edge case: delete container selection with 2 fully selected paragraphs", function(assert) {
  // when all nodes under a container selection are covered
  // fully, we want to have a default text type get inserted
  // and the cursor at its first position
  var doc = fixture(containerAnnoSample);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p2', 'content'],
    startOffset: 0,
    endPath: ['p3', 'content'],
    endOffset: 10
  });
  var args = { selection: sel, containerId: 'body' };
  var out = deleteSelection(doc, args);
  var selection = out.selection;
  assert.ok(selection.isCollapsed(), 'Selection should be collapsed afterwards.');
  assert.equal(selection.startOffset, 0, 'Cursor should be at first position');
  var p = doc.get(selection.path[0]);
  assert.equal(p.type, "paragraph", 'Cursor should be in an empty paragraph');
  assert.equal(p.content.length, 0, 'Paragraph should be empty.');
  assert.equal(doc.get('body').getPosition(p.id), 1);
});
