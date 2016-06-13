'use strict';

var test = require('../test').module('model/DocumentSession');

var extend = require('lodash/extend');
var isUndefined = require('lodash/isUndefined');
var isNull = require('lodash/isNull');
var DocumentSession = require('../../model/DocumentSession');

var fixture = require('../fixtures/createTestArticle');
var simple = require('../fixtures/simple');
var spy = require('../spy');


test("Transaction: before and after state.", function(t) {
  var doc = fixture(simple);
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
  t.ok(change !== null, "Change should be applied.");
  t.ok(change.before !== null, "Change should have before state.");
  t.ok(change.after !== null, "Change should have after state.");
  t.deepEqual(change.before, beforeState, "Change.before should be the same.");
  t.ok(change.after.selection.equals(afterState.selection), "Change.after.selection should be set correctly.");
  t.equal(change.after.some, beforeState.some, "Not updated state variables should be forwarded.");
  t.end();
});

test("Keeping TransactionDocument up-to-date.", function(t) {
  var doc = fixture(simple);
  var docSession = new DocumentSession(doc);
  docSession.stage._apply = spy(docSession.stage, '_apply');

  doc.create({ type: 'paragraph', id: 'foo', content: 'foo'});
  var p = docSession.stage.get('foo');
  t.equal(docSession.stage._apply.callCount, 1, "Stage should have been updated.");
  t.ok(!isUndefined(p) && !isNull(p), "Stage should contain new paragraph node.");
  t.equal(p.content, "foo");
  t.end();
});

test("Undoing and redoing a change.", function(t) {
  var doc = fixture(simple);
  var docSession = new DocumentSession(doc);
  docSession.transaction(function(tx) {
    tx.update(['p1', 'content'], { insert: {offset: 3, value: "XXX"} });
  });

  t.equal(doc.get(['p1', 'content']), '012XXX3456789', 'Text should have been inserted.');
  t.equal(docSession.canUndo(), true, 'Undo should be possible');
  docSession.undo();
  t.equal(doc.get(['p1', 'content']), '0123456789', 'Original text should have been recovered.');
  t.equal(docSession.canUndo(), false, 'Undo should be disabled');
  t.equal(docSession.canRedo(), true, 'Redo should be possible');
  docSession.redo();
  t.equal(doc.get(['p1', 'content']), '012XXX3456789', 'Text should have been changed again.');
  t.end();
});

test("Selections after undo/redo.", function(t) {
  var doc = fixture(simple);
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
  t.ok(sel.equals(doc.createSelection(path, 3)), 'Selection should be set correctly after undo.');
  docSession.redo();
  sel = docSession.getSelection();
  t.ok(sel.equals(doc.createSelection(path, 6)), 'Selection should be set correctly after redo.');
  t.end();
});

test("Undoing and redoing a change after external change.", function(t) {
  var doc = fixture(simple);
  var docSession = new DocumentSession(doc);
  docSession.transaction(function(tx) {
    tx.update(['p1', 'content'], { insert: {offset: 3, value: "XXX"} });
  });
  // this change is not managed by the document session
  // thus undo/redo should not touch this
  doc.update(['p1', 'content'], { insert: {offset: 3, value: "YYY"} });

  t.equal(doc.get(['p1', 'content']), '012YYYXXX3456789', 'Text should have been inserted.');
  t.equal(docSession.canUndo(), true, 'Undo should be possible');
  docSession.undo();
  t.equal(doc.get(['p1', 'content']), '012YYY3456789', 'Original text should have been recovered.');
  t.equal(docSession.canUndo(), false, 'Undo should be disabled');
  t.equal(docSession.canRedo(), true, 'Redo should be possible');
  docSession.redo();
  t.equal(doc.get(['p1', 'content']), '012YYYXXX3456789', 'Text should have been changed again.');
  t.end();
});

test("Undoing and redoing a change after external change (II).", function(t) {
  var doc = fixture(simple);
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

  t.equal(doc.get(['p1', 'content']), '012XXXYYYZZZ3456789', 'Text should have been inserted.');
  docSession.undo();
  t.equal(doc.get(['p1', 'content']), '012XXXYYY3456789', 'Correct after first undo.');
  docSession.undo();
  t.equal(doc.get(['p1', 'content']), '012YYY3456789', 'Correct after second undo');
  docSession.redo();
  t.equal(doc.get(['p1', 'content']), '012XXXYYY3456789', 'Correct after first redo.');
  docSession.redo();
  t.equal(doc.get(['p1', 'content']), '012XXXYYYZZZ3456789', 'Correct after second undo.');
  t.end();
});

test("Undo/Redo with two DocumentSessions.", function(t) {
  // This is not testing the real-time collab hub, just the general ability of
  // DocumentSession to react on external changes
  var doc = fixture(simple);
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
  t.equal(doc.get(['p1', 'content']), '012XXXYYYZZZ3456789', 'Text should have been inserted.');
  session2.undo();
  t.equal(doc.get(['p1', 'content']), '012XXXZZZ3456789', 'session2.undo()');
  session1.undo();
  t.equal(doc.get(['p1', 'content']), '012XXX3456789', 'session1.undo()');
  session2.redo();
  t.equal(doc.get(['p1', 'content']), '012XXXYYY3456789', 'session2.redo()');
  session1.undo();
  t.equal(doc.get(['p1', 'content']), '012YYY3456789', 'session1.undo()');
  t.end();
});
