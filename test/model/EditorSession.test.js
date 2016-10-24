import { module, spy } from 'substance-test'

import extend from 'lodash/extend'
import EditorSession from '../../model/EditorSession'
import Configurator from '../../util/Configurator'
import fixture from '../fixtures/createTestArticle'
import simple from '../fixtures/simple'

const test = module('model/EditorSession')

test("Transaction: before and after state.", function(t) {
  var doc = fixture(simple)
  var session = _createEditorSession(doc)
  var beforeState = {
    selection: doc.createSelection(['p1', 'content'], 1),
    some: "other"
  }
  var afterState = {
    selection: doc.createSelection(['p1', 'content'], 2)
  }
  var change = session.transaction(function(tx, args) {
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
  var session = _createEditorSession(doc)
  session._transactionDocument._apply = spy(session._transactionDocument, '_apply')

  doc.create({ type: 'paragraph', id: 'foo', content: 'foo'})
  var p = session._transactionDocument.get('foo')
  t.equal(session._transactionDocument._apply.callCount, 1, "Stage should have been updated.")
  t.notNil(p, "Stage should contain new paragraph node.")
  t.equal(p.content, "foo")
  t.end()
})

test("Undoing and redoing a change.", function(t) {
  var doc = fixture(simple)
  var session = _createEditorSession(doc)
  session.transaction(function(tx) {
    tx.update(['p1', 'content'], { insert: {offset: 3, value: "XXX"} })
  })

  t.equal(doc.get(['p1', 'content']), '012XXX3456789', 'Text should have been inserted.')
  t.equal(session.canUndo(), true, 'Undo should be possible')
  session.undo()
  t.equal(doc.get(['p1', 'content']), '0123456789', 'Original text should have been recovered.')
  t.equal(session.canUndo(), false, 'Undo should be disabled')
  t.equal(session.canRedo(), true, 'Redo should be possible')
  session.redo()
  t.equal(doc.get(['p1', 'content']), '012XXX3456789', 'Text should have been changed again.')
  t.end()
})

test("Selections after undo/redo.", function(t) {
  var doc = fixture(simple)
  var session = _createEditorSession(doc)
  var path = ['p1', 'content']
  session.setSelection(doc.createSelection(path, 3))
  session.transaction(function(tx, args) {
    tx.update(path, { insert: {offset: 3, value: "XXX"} })
    args.selection = tx.createSelection(path, 6)
    return args
  })
  session.undo()
  var sel = session.getSelection()
  t.ok(sel.equals(doc.createSelection(path, 3)), 'Selection should be set correctly after undo.')
  session.redo()
  sel = session.getSelection()
  t.ok(sel.equals(doc.createSelection(path, 6)), 'Selection should be set correctly after redo.')
  t.end()
})


function _createEditorSession(doc) {
  return new EditorSession(doc, {
    configurator: new Configurator()
  })
}