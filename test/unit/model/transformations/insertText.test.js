"use strict";
require('../../qunit_extensions');

var sample1 = require('../../../fixtures/sample1');
var insertText = require('../../../../model/transform/insertText');

QUnit.module('model/transform/insertText');

QUnit.test("insert text at cursor position", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 4
  });
  var args = {selection: sel, text: 'test' };
  args = insertText(doc, args);
  assert.equal(doc.get(['p1', 'content']), 'Paratestgraph 1', 'Text should be inserted.');
  assert.equal(args.selection.start.offset, 8, 'selection should be updated.');
  assert.ok(args.selection.isCollapsed(), 'selection should be collapsed.');
});

QUnit.test("writer over an expanded property selection", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 4,
    endOffset: 9
  });
  var args = {selection: sel, text: 'test' };
  args = insertText(doc, args);
  assert.equal(doc.get(['p1', 'content']), 'Paratest 1', 'Text should be overwritten.');
  assert.equal(args.selection.start.offset, 8, 'selection should be updated.');
  assert.ok(args.selection.isCollapsed(), 'selection should be collapsed.');
});

QUnit.test("insert text before annotation", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 4
  });
  var args = {selection: sel, text: 'test' };
  args = insertText(doc, args);
  var anno = doc.get('em1');
  assert.equal(anno.startOffset, 19, 'Annotation startOffset should be shifted.');
  assert.equal(anno.endOffset, 29, 'Annotation endOffset should be shifted.');
});

QUnit.test("insert text at left annotation boundary", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 15
  });
  var args = {selection: sel, text: 'test' };
  args = insertText(doc, args);
  var anno = doc.get('em1');
  assert.equal(anno.startOffset, 19, 'Annotation startOffset should not be expanded but be shifted.');
});

QUnit.test("insert text into annotation range", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 17
  });
  var args = {selection: sel, text: 'test' };
  args = insertText(doc, args);
  var anno = doc.get('em1');
  assert.equal(anno.startOffset, 15, 'Annotation startOffset should not be changed.');
  assert.equal(anno.endOffset, 29, 'Annotation endOffset should be shifted.');
});

QUnit.test("insert text at right annotation boundary", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 25
  });
  var args = {selection: sel, text: 'test' };
  insertText(doc, args);
  var anno = doc.get('em1');
  assert.equal(anno.endOffset, 29, 'Annotation endOffset should be expanded.');
});

QUnit.test("insert text on annotation range should preserve annotation", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 15,
    endOffset: 25
  });
  var args = {selection: sel, text: 'test' };
  insertText(doc, args);
  var anno = doc.get('em1');
  assert.isDefinedAndNotNull(anno, "Annotation should still exist.");
  assert.equal(anno.endOffset, 19, 'Annotation endOffset should be updated.');
});
