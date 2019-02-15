import { test } from 'substance-test'
import { DocumentSession, ChangeHistoryView, AbstractEditorSession } from 'substance'
import createTestArticle from './fixture/createTestArticle'
import simple from './fixture/simple'

test('ChangeHistory: undoing and redoing changes by a single user', t => {
  let { doc, editorSession } = _setup()
  let p1 = doc.get('p1')
  let originalContent = p1.getText()
  editorSession.setSelection({
    type: 'property',
    path: p1.getPath(),
    startOffset: 0
  })
  editorSession.transaction(tx => {
    tx.insertText('X')
  })
  editorSession.transaction(tx => {
    tx.insertText('Y')
  })
  editorSession.transaction(tx => {
    tx.insertText('Z')
  })
  t.comment('applying three changes')
  t.equal(p1.getText(), 'XYZ' + originalContent, 'the text should have been changed')
  t.ok(editorSession.canUndo(), 'undo should be possible')
  t.notOk(editorSession.canRedo(), 'redo should not be possible')
  t.comment('undo')
  editorSession.undo()
  t.equal(p1.getText(), 'XY' + originalContent, 'third change should have been undone')
  t.ok(editorSession.canUndo(), 'undo should be possible')
  t.ok(editorSession.canRedo(), 'redo should be possible')
  t.comment('undo')
  editorSession.undo()
  t.equal(p1.getText(), 'X' + originalContent, 'second change should have been undone')
  t.ok(editorSession.canUndo(), 'undo should be possible')
  t.ok(editorSession.canRedo(), 'redo should be possible')
  t.comment('undo')
  editorSession.undo()
  t.equal(p1.getText(), originalContent, 'first change should have been undone')
  t.notOk(editorSession.canUndo(), 'undo should not be possible')
  t.ok(editorSession.canRedo(), 'redo should be possible')
  t.comment('redo')
  editorSession.redo()
  t.equal(p1.getText(), 'X' + originalContent, 'first change should have been redone')
  t.ok(editorSession.canUndo(), 'undo should be possible')
  t.ok(editorSession.canRedo(), 'redo should be possible')
  t.comment('redo')
  editorSession.redo()
  t.equal(p1.getText(), 'XY' + originalContent, 'second change should have been redone')
  t.ok(editorSession.canUndo(), 'undo should be possible')
  t.ok(editorSession.canRedo(), 'redo should be possible')
  t.comment('redo')
  editorSession.redo()
  t.equal(p1.getText(), 'XYZ' + originalContent, 'third change should have been redone')
  t.ok(editorSession.canUndo(), 'undo should be possible')
  t.notOk(editorSession.canRedo(), 'redo should not be possible')
  t.comment('undo')
  editorSession.undo()
  t.equal(p1.getText(), 'XY' + originalContent, 'third change should have been undone')
  t.ok(editorSession.canUndo(), 'undo should be possible')
  t.ok(editorSession.canRedo(), 'redo should be possible')
  t.comment('undo')
  editorSession.undo()
  t.equal(p1.getText(), 'X' + originalContent, 'second change should have been undone')
  t.ok(editorSession.canUndo(), 'undo should be possible')
  t.ok(editorSession.canRedo(), 'redo should be possible')
  t.comment('undo')
  editorSession.undo()
  t.equal(p1.getText(), originalContent, 'first change should have been undone')
  t.notOk(editorSession.canUndo(), 'undo should not be possible')
  t.ok(editorSession.canRedo(), 'redo should be possible')
  t.end()
})

function _setup () {
  let doc = createTestArticle(simple)
  let documentSession = new DocumentSession(doc)
  let history = new ChangeHistoryView(documentSession)
  let editorSession = new TestEditorSession('test', documentSession, history)
  return { doc, documentSession, history, editorSession }
}

class TestEditorSession extends AbstractEditorSession {
  _getSelection () {
    return this._selection
  }
  _setSelection (sel) {
    this._selection = sel
  }
}
