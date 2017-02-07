import TestEditor from './TestEditor'
import createTestEditorSession from './createTestEditorSession'

export default function setupEditor(t, ...f) {
  let editor = TestEditor.mount({ editorSession: createTestEditorSession(...f) }, t.sandbox)
  let editorSession = editor.editorSession
  let doc = editorSession.getDocument()
  let surface = editor.refs.surface
  return { editor, editorSession, doc, surface }
}

