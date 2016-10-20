import { module, spy } from 'substance-test'

import extend from 'lodash/extend'
import isUndefined from 'lodash/isUndefined'
import isNull from 'lodash/isNull'
import DocumentSession from '../../model/DocumentSession'
import fixture from '../fixtures/createTestArticle'
import simple from '../fixtures/simple'

const test = module('model/DocumentSession')

test("Transaction: before and after state.", function(t) {
  var doc = fixture(simple)
  var docSession = new DocumentSession(doc)
  var beforeState = {
    selection: doc.createSelection(['p1', 'content'], 1),
    some: "other"
  }
  var afterState = {
    selection: doc.createSelection(['p1', 'content'], 2)
  }
  var change = docSession.transaction(function(tx, args) {
    extend(tx.before, beforeState)
    tx.create({ type: 'paragraph', id: 'bla', content: ""})
    args.selection = doc.createSelection(['p1', 'content'], 2)
    return args
  })
  t.ok(change !== null, "Change should be applied.")
  t.ok(change.before !== null, "Change should have before state.")
  t.ok(change.after !== null, "Change should have after state.")
  t.deepEqual(change.before, beforeState, "Change.before should be the same.")
  t.ok(change.after.selection.equals(afterState.selection), "Change.after.selection should be set correctly.")
  t.equal(change.after.some, beforeState.some, "Not updated state variables should be forwarded.")
  t.end()
})

test("Keeping TransactionDocument up-to-date.", function(t) {
  var doc = fixture(simple)
  var docSession = new DocumentSession(doc)
  docSession.stage._apply = spy(docSession.stage, '_apply')

  doc.create({ type: 'paragraph', id: 'foo', content: 'foo'})
  var p = docSession.stage.get('foo')
  t.equal(docSession.stage._apply.callCount, 1, "Stage should have been updated.")
  t.notNil(p, "Stage should contain new paragraph node.")
  t.equal(p.content, "foo")
  t.end()
})

test("Undoing and redoing a change.", function(t) {
  var doc = fixture(simple)
  var docSession = new DocumentSession(doc)
  docSession.transaction(function(tx) {
    tx.update(['p1', 'content'], { insert: {offset: 3, value: "XXX"} })
  })

  t.equal(doc.get(['p1', 'content']), '012XXX3456789', 'Text should have been inserted.')
  t.equal(docSession.canUndo(), true, 'Undo should be possible')
  docSession.undo()
  t.equal(doc.get(['p1', 'content']), '0123456789', 'Original text should have been recovered.')
  t.equal(docSession.canUndo(), false, 'Undo should be disabled')
  t.equal(docSession.canRedo(), true, 'Redo should be possible')
  docSession.redo()
  t.equal(doc.get(['p1', 'content']), '012XXX3456789', 'Text should have been changed again.')
  t.end()
})

test("Selections after undo/redo.", function(t) {
  var doc = fixture(simple)
  var docSession = new DocumentSession(doc)
  var path = ['p1', 'content']
  docSession.setSelection(doc.createSelection(path, 3))
  docSession.transaction(function(tx, args) {
    tx.update(path, { insert: {offset: 3, value: "XXX"} })
    args.selection = tx.createSelection(path, 6)
    return args
  })
  docSession.undo()
  var sel = docSession.getSelection()
  t.ok(sel.equals(doc.createSelection(path, 3)), 'Selection should be set correctly after undo.')
  docSession.redo()
  sel = docSession.getSelection()
  t.ok(sel.equals(doc.createSelection(path, 6)), 'Selection should be set correctly after redo.')
  t.end()
})
