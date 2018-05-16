import TestEditor from './TestEditor'
import createTestEditorSession from './createTestEditorSession'
import getMountPoint from './getMountPoint'

export default function setupEditor (t, ...f) {
  let editor = TestEditor.mount({ editorSession: createTestEditorSession(...f) }, getMountPoint(t))
  let editorSession = editor.editorSession
  let doc = editorSession.getDocument()
  let surface = editor.refs.surface
  return { editor, editorSession, doc, surface }
}
