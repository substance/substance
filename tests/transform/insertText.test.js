"use strict";

var test = require('tape');

var insertText = require('../../model/transform/insertText');
var fixture = require('../fixtures/createTestArticle');
var headersAndParagraphs = require('../fixtures/headersAndParagraphs');

test("insert text at cursor position", function(t) {
  var doc = fixture(headersAndParagraphs);
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 4
  });
  var args = {selection: sel, text: 'test' };
  args = insertText(doc, args);
  t.equal(doc.get(['p1', 'content']), 'Paratestgraph 1', 'Text should be inserted.');
  t.equal(args.selection.start.offset, 8, 'selection should be updated.');
  t.ok(args.selection.isCollapsed(), 'selection should be collapsed.');
  t.end();
});

test("writer over an expanded property selection", function(t) {
  var doc = fixture(headersAndParagraphs);
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 4,
    endOffset: 9
  });
  var args = {selection: sel, text: 'test' };
  args = insertText(doc, args);
  t.equal(doc.get(['p1', 'content']), 'Paratest 1', 'Text should be overwritten.');
  t.equal(args.selection.start.offset, 8, 'selection should be updated.');
  t.ok(args.selection.isCollapsed(), 'selection should be collapsed.');
  t.end();
});

test("insert text before annotation", function(t) {
  var doc = fixture(headersAndParagraphs);
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 4
  });
  var args = {selection: sel, text: 'test' };
  args = insertText(doc, args);
  var anno = doc.get('em1');
  t.equal(anno.startOffset, 19, 'Annotation startOffset should be shifted.');
  t.equal(anno.endOffset, 29, 'Annotation endOffset should be shifted.');
  t.end();
});

test("insert text at left annotation boundary", function(t) {
  var doc = fixture(headersAndParagraphs);
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 15
  });
  var args = {selection: sel, text: 'test' };
  args = insertText(doc, args);
  var anno = doc.get('em1');
  t.equal(anno.startOffset, 19, 'Annotation startOffset should not be expanded but be shifted.');
  t.end();
});

test("insert text into annotation range", function(t) {
  var doc = fixture(headersAndParagraphs);
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 17
  });
  var args = {selection: sel, text: 'test' };
  args = insertText(doc, args);
  var anno = doc.get('em1');
  t.equal(anno.startOffset, 15, 'Annotation startOffset should not be changed.');
  t.equal(anno.endOffset, 29, 'Annotation endOffset should be shifted.');
  t.end();
});

test("insert text at right annotation boundary", function(t) {
  var doc = fixture(headersAndParagraphs);
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 25
  });
  var args = {selection: sel, text: 'test' };
  insertText(doc, args);
  var anno = doc.get('em1');
  t.equal(anno.endOffset, 29, 'Annotation endOffset should be expanded.');
  t.end();
});

// TODO: this is currently not implemented
// test("insert text on annotation range should preserve annotation", function(t) {
//   var doc = fixture(headersAndParagraphs);
//   var sel = doc.createSelection({
//     type: 'property',
//     path: ['p2', 'content'],
//     startOffset: 15,
//     endOffset: 25
//   });
//   var args = {selection: sel, text: 'test' };
//   insertText(doc, args);
//   var anno = doc.get('em1');
//   t.isDefinedAndNotNull(anno, "Annotation should still exist.");
//   t.equal(anno.endOffset, 19, 'Annotation endOffset should be updated.');
// });
