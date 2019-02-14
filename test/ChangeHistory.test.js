import { test } from 'substance-test'
import { DocumentSession, ChangeHistoryView, AbstractEditorSession } from 'substance'
import createTestArticle from './fixture/createTestArticle'
import simple from './fixture/simple'

test('ChangeHistory: undoing a change', t => {
  let { doc, editorSession } = _setup()
  let p1 = doc.get('p1')
  let originalContent = p1.getText()
  editorSession.setSelection({
    type: 'property',
    path: p1.getPath(),
    startOffset: 0
  })
  editorSession.transaction(tx => {
    tx.insertText('XXX')
  })
  t.equal(p1.getText(), 'XXX' + originalContent, 'the text should have been changed')
  t.ok(editorSession.canUndo(), 'undo should be possible')
  editorSession.undo()
  t.equal(p1.getText(), originalContent, 'change should have been reverted')
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
