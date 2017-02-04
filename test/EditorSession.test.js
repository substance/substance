import { module, spy } from 'substance-test'
import setupEditor from './fixture/setupEditor'
import simple from './fixture/simple'

const test = module('EditorSession')

test("Keeping TransactionDocument up-to-date.", function(t) {
  let { editorSession, doc } = setupEditor(t, simple)
  let stageDoc = editorSession._transaction._stageDoc
  stageDoc._apply = spy(stageDoc, '_apply')
  doc.create({ type: 'paragraph', id: 'foo', content: 'foo'})
  var p = stageDoc.get('foo')
  t.equal(stageDoc._apply.callCount, 1, "Stage should have been updated.")
  t.notNil(p, "Stage should contain new paragraph node.")
  t.equal(p.content, "foo")
  t.end()
})

test("Undoing and redoing a change.", function(t) {
  let { editorSession, doc } = setupEditor(t, simple)
  editorSession.transaction(function(tx) {
    tx.update(['p1', 'content'], { type: 'insert', start: 3, text: "XXX" })
  })
  t.equal(doc.get(['p1', 'content']), '012XXX3456789', 'Text should have been inserted.')
  t.equal(editorSession.canUndo(), true, 'Undo should be possible')
  editorSession.undo()
  t.equal(doc.get(['p1', 'content']), '0123456789', 'Original text should have been recovered.')
  t.equal(editorSession.canUndo(), false, 'Undo should be disabled')
  t.equal(editorSession.canRedo(), true, 'Redo should be possible')
  editorSession.redo()
  t.equal(doc.get(['p1', 'content']), '012XXX3456789', 'Text should have been changed again.')
  t.end()
})

test("Selections after undo/redo.", function(t) {
  let { editorSession, doc } = setupEditor(t, simple)
  var path = ['p1', 'content']
  editorSession.setSelection({
    type: 'property',
    path: path,
    startOffset: 3
  })
  editorSession.transaction(function(tx) {
    tx.update(path, { type: 'insert', start: 3, text: "XXX" })
    tx.setSelection({
      type: 'property',
      path: path,
      startOffset: 6
    })
  })
  editorSession.undo()
  var sel = editorSession.getSelection()
  t.ok(sel.equals(doc.createSelection({
    type: 'property',
    path: path,
    startOffset: 3
  })), 'Selection should be set correctly after undo.')
  editorSession.redo()
  sel = editorSession.getSelection()
  t.ok(sel.equals(doc.createSelection({
    type: 'property',
    path: path,
    startOffset: 6
  })), 'Selection should be set correctly after redo.')
  t.end()
})

