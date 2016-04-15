'use strict';

require('../qunit_extensions');
var sinon = require('sinon');
var extend = require('lodash/extend');
var DocumentSession = require('../../../model/DocumentSession');
var simple = require('../../fixtures/simple');

QUnit.module('model/DocumentSession');

QUnit.test("Transaction: before and after state.", function(assert) {
  var doc = simple();
  var docSession = new DocumentSession(doc);
  var change = null;
  doc.on('document:changed', function(_change) {
    change = _change;
  });
  var beforeState = {
    selection: doc.createSelection(['p1', 'content'], 1),
    some: "other"
  };
  var afterState = {
    selection: doc.createSelection(['p1', 'content'], 2)
  };
  docSession.transaction(function(tx, args) {
    extend(tx.before, beforeState);
    tx.create({ type: 'paragraph', id: 'bla', content: ""});
    args.selection = doc.createSelection(['p1', 'content'], 2);
    return args;
  });
  assert.ok(change !== null, "Change should be applied.");
  assert.ok(change.before !== null, "Change should have before state.");
  assert.ok(change.after !== null, "Change should have after state.");
  assert.deepEqual(change.before, beforeState, "Change.before should be the same.");
  assert.ok(change.after.selection.equals(afterState.selection), "Change.after.selection should be set correctly.");
  assert.equal(change.after.some, beforeState.some, "Not updated state variables should be forwarded.");
});

QUnit.test("Keeping TransactionDocument up-to-date.", function(assert) {
  var doc = simple();
  var docSession = new DocumentSession(doc);
  docSession.stage._apply = sinon.spy(docSession.stage, '_apply');

  doc.create({ type: 'paragraph', id: 'foo', content: 'foo'});
  var p = docSession.stage.get('foo');
  assert.equal(docSession.stage._apply.callCount, 1, "Stage should have been updated.");
  assert.isDefinedAndNotNull(p, "Stage should contain new paragraph node.");
  assert.equal(p.content, "foo");
});

QUnit.test("Undoing and redoing a change.", function(assert) {
  var doc = simple();
  var docSession = new DocumentSession(doc);
  docSession.transaction(function(tx) {
    tx.update(['p1', 'content'], { insert: {offset: 3, value: "XXX"} });
  });

  assert.equal(doc.get(['p1', 'content']), '012XXX3456789', 'Text should have been inserted.');
  assert.equal(docSession.canUndo(), true, 'Undo should be possible');
  docSession.undo();
  assert.equal(doc.get(['p1', 'content']), '0123456789', 'Original text should have been recovered.');
  assert.equal(docSession.canUndo(), false, 'Undo should be disabled');
  assert.equal(docSession.canRedo(), true, 'Redo should be possible');
  docSession.redo();
  assert.equal(doc.get(['p1', 'content']), '012XXX3456789', 'Text should have been changed again.');
});

QUnit.test("Selections after undo/redo.", function(assert) {
  var doc = simple();
  var docSession = new DocumentSession(doc);
  var path = ['p1', 'content'];
  docSession.setSelection(doc.createSelection(path, 3));
  docSession.transaction(function(tx, args) {
    tx.update(path, { insert: {offset: 3, value: "XXX"} });
    args.selection = tx.createSelection(path, 6);
    return args;
  });
  docSession.undo();
  var sel = docSession.getSelection();
  assert.ok(sel.equals(doc.createSelection(path, 3)), 'Selection should be set correctly after undo.');
  docSession.redo();
  sel = docSession.getSelection();
  assert.ok(sel.equals(doc.createSelection(path, 6)), 'Selection should be set correctly after redo.');
});


QUnit.test("Undoing and redoing a change after external change.", function(assert) {
  var doc = simple();
  var docSession = new DocumentSession(doc);
  docSession.transaction(function(tx) {
    tx.update(['p1', 'content'], { insert: {offset: 3, value: "XXX"} });
  });
  // this change is not managed by the document session
  // thus undo/redo should not touch this
  doc.update(['p1', 'content'], { insert: {offset: 3, value: "YYY"} });

  assert.equal(doc.get(['p1', 'content']), '012YYYXXX3456789', 'Text should have been inserted.');
  assert.equal(docSession.canUndo(), true, 'Undo should be possible');
  docSession.undo();
  assert.equal(doc.get(['p1', 'content']), '012YYY3456789', 'Original text should have been recovered.');
  assert.equal(docSession.canUndo(), false, 'Undo should be disabled');
  assert.equal(docSession.canRedo(), true, 'Redo should be possible');
  docSession.redo();
  assert.equal(doc.get(['p1', 'content']), '012YYYXXX3456789', 'Text should have been changed again.');
});

QUnit.test("Undoing and redoing a change after external change (II).", function(assert) {
  var doc = simple();
  var docSession = new DocumentSession(doc);
  docSession.transaction(function(tx) {
    tx.update(['p1', 'content'], { insert: {offset: 3, value: "XXX"} });
  });
  docSession.transaction(function(tx) {
    tx.update(['p1', 'content'], { insert: {offset: 6, value: "ZZZ"} });
  });
  // this change is not managed by the document session
  // thus undo/redo should not touch this
  doc.update(['p1', 'content'], { insert: {offset: 6, value: "YYY"} });

  assert.equal(doc.get(['p1', 'content']), '012XXXYYYZZZ3456789', 'Text should have been inserted.');
  docSession.undo();
  assert.equal(doc.get(['p1', 'content']), '012XXXYYY3456789', 'Correct after first undo.');
  docSession.undo();
  assert.equal(doc.get(['p1', 'content']), '012YYY3456789', 'Correct after second undo');
  docSession.redo();
  assert.equal(doc.get(['p1', 'content']), '012XXXYYY3456789', 'Correct after first redo.');
  docSession.redo();
  assert.equal(doc.get(['p1', 'content']), '012XXXYYYZZZ3456789', 'Correct after second undo.');
});

QUnit.test("Undo/Redo with two DocumentSessions.", function(assert) {
  // This is not testing the real-time collab hub, just the general ability of
  // DocumentSession to react on external changes
  var doc = simple();
  var session1 = new DocumentSession(doc);
  var session2 = new DocumentSession(doc);
  session1.transaction(function(tx) {
    tx.update(['p1', 'content'], { insert: {offset: 3, value: "XXX"} });
  });
  session2.transaction(function(tx) {
    tx.update(['p1', 'content'], { insert: {offset: 6, value: "YYY"} });
  });
  session1.transaction(function(tx) {
    tx.update(['p1', 'content'], { insert: {offset: 9, value: "ZZZ"} });
  });
  assert.equal(doc.get(['p1', 'content']), '012XXXYYYZZZ3456789', 'Text should have been inserted.');
  session2.undo();
  assert.equal(doc.get(['p1', 'content']), '012XXXZZZ3456789', 'session2.undo()');
  session1.undo();
  assert.equal(doc.get(['p1', 'content']), '012XXX3456789', 'session1.undo()');
  session2.redo();
  assert.equal(doc.get(['p1', 'content']), '012XXXYYY3456789', 'session2.redo()');
  session1.undo();
  assert.equal(doc.get(['p1', 'content']), '012YYY3456789', 'session1.undo()');
});
