"use strict";

var test = require('../test');

var deleteSelection = require('../../model/transform/deleteSelection');

var fixture = require('../fixtures/createTestArticle');
var simple = require('../fixtures/simple');
var headersAndParagraphs = require('../fixtures/headersAndParagraphs');
var containerAnnoSample = require('../fixtures/containerAnnoSample');

var isNull = require('lodash/isNull');
var isUndefined = require('lodash/isUndefined');

function isNullOrUndefined(t, x, msg) {
  return t.ok(isNull(x) || isUndefined(x), msg);
}

test("Deleting a property selection", function(t) {
  var doc = fixture(headersAndParagraphs);
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 10,
    endOffset: 15
  });
  var args = {selection: sel};
  args = deleteSelection(doc, args);
  t.equal(doc.get(['p2', 'content']), 'Paragraph annotation', 'Selected text should be deleted.');
  t.equal(args.selection.start.offset, 10, 'Selection should be collapsed to the left');
  t.end();
});

test("Deleting a property selection before annotation", function(t) {
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
  t.equal(anno.startOffset, oldStartOffset-4, 'Annotation start should be shifted left.');
  t.equal(anno.endOffset, oldEndOffset-4, 'Annotation end should be shifted left.');
  t.end();
});

test("Deleting a property selection overlapping annotation start", function(t) {
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
  t.equal(anno.startOffset, 10, 'Annotation start should be shifted left.');
  t.equal(anno.endOffset, 15, 'Annotation end should be shifted left.');
  t.end();
});

test("Deleting a property selection overlapping annotation end", function(t) {
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
  t.equal(anno.startOffset, 15, 'Annotation start should not change.');
  t.equal(anno.endOffset, 20, 'Annotation end should be shifted left.');
  t.end();
});

test("Deleting a container selection", function(t) {
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
  t.equal(doc.get(['h2', 'content']), "Section with annotation", "Rebodying content of p2 should get appended to rebodys of h2");
  t.ok(selection.isCollapsed(), 'Selection should be collapsed afterwards.');
  t.deepEqual(selection.path, ['h2', 'content'], 'Cursor should be in h2.');
  t.equal(selection.startOffset, 8, 'Cursor should be at the end of h2s rebodys');
  t.deepEqual(anno.path, ['h2', 'content'], 'Annotation should have been transferred to h2.');
  t.deepEqual([anno.startOffset, anno.endOffset], [13, 23], 'Annotation should have been placed correctly.');
  t.end();
});

test("Deleting a paragraph", function(t) {
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
  isNullOrUndefined(t, doc.get('p1'), 'Paragraph should be deleted ...');
  t.equal(body.nodes.indexOf('p1'), -1, '... and hidden.');
  t.end();
});

test("Deleting all", function(t) {
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
  t.equal(container.nodes.length, 1, "There should be one empty paragraph");
  var first = container.getChildAt(0);
  var defaultTextType = doc.getSchema().getDefaultTextType();
  t.equal(first.type, defaultTextType, "Node should be a default text node");
  var address = container.getAddress(out.selection.start);
  t.ok(out.selection.isCollapsed(), "Selection should be collapsed (Cursor).");
  t.equal(address.toString(), '0.0', "Cursor should be at very first position.");
  t.end();
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

test("Trying to delete a structured node partially", function(t) {
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
  isNullOrUndefined(t, doc.get('p1'), 'p1 should have been deleted');
  isNullOrUndefined(t, doc.get('sn1'), 'sn1 should have been deleted');
  // Check selection
  t.ok(out.selection.isCollapsed(), "Selection should be collapsed (Cursor).");
  var address = container.getAddress(out.selection.start);
  t.equal(address.toString(), '0.0', "Cursor should be in empty text node.");
  t.equal(out.selection.start.offset, 0, "Cursor should be at first position.");
  t.end();
});

test("Deleting a structured node and merge surrounding context", function(t) {
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
  t.deepEqual(containerNodes, ["h1", "h2", "p2", "h3", "p3"], 'sn and p1 should have been deleted from the container');
  var h1 = doc.get('h1');

  t.notOk(doc.get('sn'), 'Structured node should have been deleted');
  t.equal(h1.content, 'Sectgraph 1', 'h1 should have been joined with the rebodying contents of p1');
  t.end();
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

test("Delete a node without editable properties", function(t) {
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
  t.deepEqual(containerNodes, ["h1", "h2", "p2", "h3", "p3"], 'sn and p1 should have been deleted from the container');
  var h1 = doc.get('h1');

  t.notOk(doc.get('img1'), 'Structured node should have been deleted');
  t.equal(h1.content, 'Sectgraph 1', 'h1 should have been joined with the rebodying contents of p1');
  t.end();
});

test("Edge case: delete container selection spanning multiple nodes containing container annotations", function(t) {
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
  t.equal(doc.get(['p1', 'content']), "0123456", "Rebodying content of p1 should be truncated.");
  t.ok(selection.isCollapsed(), 'Selection should be collapsed afterwards.');
  t.deepEqual(a1.endPath, ['p1', 'content'], "Container annotation should be truncated");
  t.equal(a1.endOffset, 7, "Container annotation should be truncated");
  t.end();
});


test("Edge case: delete container selection with 2 fully selected paragraphs", function(t) {
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
  t.ok(selection.isCollapsed(), 'Selection should be collapsed afterwards.');
  t.equal(selection.startOffset, 0, 'Cursor should be at first position');
  var p = doc.get(selection.path[0]);
  t.equal(p.type, "paragraph", 'Cursor should be in an empty paragraph');
  t.equal(p.content.length, 0, 'Paragraph should be empty.');
  t.equal(doc.get('body').getPosition(p.id), 1);
  t.end();
});
