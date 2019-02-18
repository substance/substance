import { test } from 'substance-test'
import { AbstractEditorSession, DocumentSession } from 'substance'
import simple from './fixture/simple'
import createTestArticle from './fixture/createTestArticle'

// ATTENTION: I am in the middle of a refactor
// replacing the old EditorSession and throwing away all deprecated stuff
// This test uses the new API to have the new code test-covered.

test('EditorSessionNew: dispose()', t => {
  let { editorSession } = _setup(simple)
  t.doesNotThrow(() => {
    editorSession.dispose()
  })
  t.end()
})

test('EditorSessionNew: keeping document stage in-sync', t => {
  let { doc, editorSession } = _setup(simple)
  doc.create({ type: 'paragraph', id: 'foo', content: 'foo' })
  editorSession.transaction(tx => {
    const p = tx.get('foo')
    t.notNil(p, 'Stage should contain new paragraph node.')
    t.equal(p.content, 'foo')
  })
  t.end()
})

test('EditorSessionNew: undoing and redoing a change', t => {
  let { doc, editorSession } = _setup(simple)
  editorSession.transaction(tx => {
    tx.update(['p1', 'content'], { type: 'insert', start: 3, text: 'XXX' })
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

test('EditorSessionNew: selections after undo/redo', t => {
  let { doc, editorSession } = _setup(simple)
  var path = ['p1', 'content']
  editorSession.setSelection({
    type: 'property',
    path: path,
    startOffset: 3
  })
  editorSession.transaction(tx => {
    tx.update(path, { type: 'insert', start: 3, text: 'XXX' })
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

function _setup (seed) {
  let doc = createTestArticle(seed)
  let documentSession = new DocumentSession(doc)
  let editorSession = new TestEditorSession('test', documentSession)
  return { doc, editorSession }
}

class TestEditorSession extends AbstractEditorSession {
  _getSelection () {
    return this._selection
  }
  _setSelection (sel) {
    this._selection = sel
  }
}
