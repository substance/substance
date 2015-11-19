'use strict';
require('../qunit_extensions');

var cloneDeep = require('lodash/lang/cloneDeep');
var sample = require('../../fixtures/container_sample');
var sample1 = require('../../fixtures/sample1');

QUnit.module('model/Document');

QUnit.test("Get text for null selection.", function(assert) {
  var doc = sample();
  assert.equal(doc.getTextForSelection(null), "", "Should be empty for null selection.");
  assert.equal(doc.getTextForSelection(doc.createSelection(null)), "", "Should be empty for null selection.");
});

QUnit.test("Get text for property selection.", function(assert) {
  var doc = sample();
  var sel = doc.createSelection({
    type: "property",
    path: ["p1", "content"],
    startOffset: 0,
    endOffset: 5
  });
  assert.equal(doc.getTextForSelection(sel), "01234");
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
  assert.equal(doc.getTextForSelection(sel), "5678901234");
});


QUnit.test("Before and after state.", function(assert) {
  var doc = sample1();
  var change = null;
  doc.on('document:changed', function(_change) {
    change = _change;
  });
  var beforeState = { selection: 'foo', some: "other" };
  var afterState = { selection: 'bar' };
  doc.transaction(cloneDeep(beforeState), {}, function(tx) {
    tx.create({ type: 'paragraph', id: 'bla', content: ""});
    return cloneDeep(afterState);
  });
  assert.ok(change !== null, "Change should be applied.");
  assert.ok(change.before !== null, "Change should have before state.");
  assert.ok(change.after !== null, "Change should have after state.");
  assert.deepEqual(change.before, beforeState, "Change.before should be the same.");
  assert.equal(change.after.selection, afterState.selection, "Change.after.selection should be set correctly.");
  assert.equal(change.after.some, beforeState.some, "Not updated state variables should be forwarded.");
});
