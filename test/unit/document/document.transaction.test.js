'use strict';

var _ = require('../../../util/helpers');
var sample1 = require('../../fixtures/sample1');

QUnit.module('Substance.Document/Transactions');

QUnit.test("Before and after state.", function(assert) {
  var doc = sample1();
  var change = null;
  doc.on('document:changed', function(_change) {
    change = _change;
  });
  var beforeState = { selection: 'foo', some: "other" };
  var afterState = { selection: 'bar' };
  doc.transaction(_.clone(beforeState), {}, function(tx) {
    tx.create({ type: 'paragraph', id: 'bla', content: ""});
    return _.clone(afterState);
  });
  assert.ok(change !== null, "Change should be applied.");
  assert.ok(change.before !== null, "Change should have before state.");
  assert.ok(change.after !== null, "Change should have after state.");
  assert.deepEqual(change.before, beforeState, "Change.before should be the same.");
  assert.equal(change.after.selection, afterState.selection, "Change.after.selection should be set correctly.");
  assert.equal(change.after.some, beforeState.some, "Not updated state variables should be forwarded.");
});
