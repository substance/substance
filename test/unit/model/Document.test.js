'use strict';

require('../qunit_extensions');
var sample = require('../../fixtures/container_sample');
var documentHelpers = require('../../../model/documentHelpers');

QUnit.module('model/Document');

QUnit.test("Create null selection.", function(assert) {
  var doc = sample();
  var sel = doc.createSelection(null);
  assert.ok(sel.isNull(), 'Selection should be null.');
});

QUnit.test("Create collapsed property selection.", function(assert) {
  var doc = sample();
  var sel = doc.createSelection(['p1', 'content'], 3);
  assert.ok(sel.isPropertySelection(), 'Selection should be a property selection.');
  assert.ok(sel.isCollapsed(), 'Selection should be collapsed.');
  assert.deepEqual(sel.path, ['p1', 'content'], 'sel.path should be correct.');
  assert.deepEqual(sel.startOffset, 3, 'sel.startOffset should be correct.');
});

QUnit.test("Create expanded property selection.", function(assert) {
  var doc = sample();
  var sel = doc.createSelection(['p1', 'content'], 1, 4);
  assert.ok(sel.isPropertySelection(), 'Selection should be a property selection.');
  assert.notOk(sel.isCollapsed(), 'Selection should not be collapsed.');
  assert.deepEqual(sel.path, ['p1', 'content'], 'sel.path should be correct.');
  assert.deepEqual(sel.startOffset, 1, 'sel.startOffset should be correct.');
  assert.deepEqual(sel.endOffset, 4, 'sel.endOffset should be correct.');
});

QUnit.test("Get text for null selection.", function(assert) {
  var doc = sample();
  assert.equal(documentHelpers.getTextForSelection(doc, null), "", "Should be empty for null selection.");
  assert.equal(documentHelpers.getTextForSelection(doc, doc.createSelection(null)), "", "Should be empty for null selection.");
});

QUnit.test("Get text for property selection.", function(assert) {
  var doc = sample();
  var sel = doc.createSelection({
    type: "property",
    path: ["p1", "content"],
    startOffset: 0,
    endOffset: 5
  });
  assert.equal(documentHelpers.getTextForSelection(doc, sel), "01234");
});

QUnit.test("Get text for container selection.", function(assert) {
  var doc = sample();
  var sel = doc.createSelection({
    type: "container",
    containerId: "main",
    startPath: ["p1", "content"],
    startOffset: 5,
    endPath: ["p2", "content"],
    endOffset: 5
  });
  assert.equal(documentHelpers.getTextForSelection(doc, sel), "56789\n01234");
});
