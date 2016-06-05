"use strict";

require('../QUnitExtensions');
var simple = require('../fixtures/simple');
var paste = require('../../model/transform/paste');
var copySelection = require('../../model/transform/copySelection');
// var Table = require('../../packages/table/Table');
var CLIPBOARD_CONTAINER_ID = copySelection.CLIPBOARD_CONTAINER_ID;
var CLIPBOARD_PROPERTY_ID = copySelection.CLIPBOARD_PROPERTY_ID;

QUnit.module('model/transform/paste');

QUnit.test("Pasting plain text", function(assert) {
  var doc = simple();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3
  });
  var args = {selection: sel, text: 'XXX'};
  paste(doc, args);
  var p1 = doc.get('p1');
  assert.equal(p1.content, '012XXX3456789');
});

QUnit.test("Pasting a single paragraph", function(assert) {
  var doc = simple();
  var pasteDoc = doc.newInstance();
  var container = pasteDoc.create({
    type: "container",
    id: CLIPBOARD_CONTAINER_ID,
    nodes: []
  });
  var p = pasteDoc.create({
    type: 'paragraph',
    id: CLIPBOARD_PROPERTY_ID,
    content: 'AABBCC'
  });
  container.show(p.id);
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3
  });
  var args = {selection: sel, doc: pasteDoc};
  paste(doc, args);
  var p1 = doc.get('p1');
  assert.equal(p1.content, '012AABBCC3456789', 'Plain text should be inserted.');
});

QUnit.test("Pasting annotated text", function(assert) {
  var doc = simple();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3
  });
  var pasteDoc = doc.newInstance();
  var container = pasteDoc.create({
    type: "container",
    id: CLIPBOARD_CONTAINER_ID,
    nodes: []
  });
  var p = pasteDoc.create({
    type: 'paragraph',
    id: CLIPBOARD_PROPERTY_ID,
    content: 'AABBCC'
  });
  container.show(p.id);
  pasteDoc.create({
    type: 'strong',
    id: 's1',
    path: [p.id, 'content'],
    startOffset: 2,
    endOffset: 4
  });
  var args = {selection: sel, doc: pasteDoc};
  paste(doc, args);
  var p1 = doc.get('p1');
  assert.equal(p1.content, '012AABBCC3456789', 'Plain text should be inserted.');
  var s1 = doc.get('s1');
  assert.deepEqual(s1.path, [p1.id, 'content'], 'Annotation is bound to the correct path.');
  assert.deepEqual([s1.startOffset, s1.endOffset], [5, 7], 'Annotation has correct range.');
});

QUnit.test("Pasting two paragraphs", function(assert) {
  var doc = simple();
  var pasteDoc = doc.newInstance();
  var container = pasteDoc.create({
    type: "container",
    id: CLIPBOARD_CONTAINER_ID,
    nodes: []
  });
  var test1 = pasteDoc.create({
    type: 'paragraph',
    id: 'test1',
    content: 'AA'
  });
  container.show(test1.id);
  var test2 = pasteDoc.create({
    type: 'paragraph',
    id: 'test2',
    content: 'BB'
  });
  container.show(test2.id);
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3
  });
  var args = {containerId: 'main', selection: sel, doc: pasteDoc};
  paste(doc, args);
  var main = doc.get('main');
  var p1 = doc.get('p1');
  assert.equal(p1.content, '012AA', 'First part should be inserted into first paragraph.');
  assert.equal(main.nodes[1], test2.id, 'Second part should go into a single paragraph.');
  assert.equal(doc.get(main.nodes[2]).content, '3456789', 'Remaining part of first paragraph should be in a new paragraph.');
  assert.equal(main.nodes[3], 'p2', 'After that should follow p2.');
});

// QUnit.test("Pasting a table", function(assert) {
//   var doc = simple();
//   var pasteDoc = doc.newInstance();
//   var tsv = [
//     ['A', 'B', 'C', 'D'].join('\t'),
//     ['1', '2', '3', '4'].join('\t'),
//     ['5', '6', '7', '8'].join('\t'),
//     ['9', '10', '11', '12'].join('\t'),
//   ].join('\n');
//   var container = pasteDoc.create({
//     type: "container",
//     id: CLIPBOARD_CONTAINER_ID,
//     nodes: []
//   });
//   var table = Table.fromTSV(pasteDoc, tsv);
//   container.show(table.id);
//   var sel = doc.createSelection({
//     type: 'property',
//     path: ['p1', 'content'],
//     startOffset: 3
//   });
//   var args = {containerId: 'main', selection: sel, doc: pasteDoc};
//   paste(doc, args);
//   var main = doc.get('main');
//   var p1 = doc.get('p1');
//   assert.equal(p1.content, '012', 'First paragraph should be truncated.');
//   assert.equal(doc.get(main.nodes[2]).content, '3456789', 'Remaining part of first paragraph should be in a new paragraph.');
//   assert.equal(main.nodes[1], table.id, 'Table should be inserted between two paragraphs.');
//   assert.equal(doc.get(table.id).toTSV(), tsv, 'TSV should be correct.');
// });
