"use strict";

var sample1 = require('../../fixtures/sample1');
var deleteCharacter = require('../../../model/transformations/delete_character');

QUnit.module('Transformations/deleteCharacter');

QUnit.test("Backspacing", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 4
  });
  var args = {selection: sel, direction: 'left'};
  deleteCharacter(doc, args);
  assert.equal(doc.get(['p2', 'content']), 'Pargraph with annotation', 'Character should be deleted.');
});

QUnit.test("Deleting a character", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 4
  });
  var args = {selection: sel, direction: 'right'};
  deleteCharacter(doc, args);
  assert.equal(doc.get(['p2', 'content']), 'Pararaph with annotation', 'Character should be deleted.');
});

QUnit.test("Backspacing into previous component", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 0
  });
  var args = {selection: sel, containerId: 'main', direction: 'left'};
  var out = deleteCharacter(doc, args);
  var selection = out.selection;
  assert.equal(doc.get(['h2', 'content']), 'Section 2Paragraph with annotation', 'Content of p2 should have been merged into h2.');
  assert.isNullOrUndefined(doc.get('p2'), 'p2 should be gone.');
  assert.ok(selection.isCollapsed(), 'Selection should be collapsed.');
  assert.equal(selection.startOffset, 9, 'Cursor should be before the first character of the merged text.');
});
