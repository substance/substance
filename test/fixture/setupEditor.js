import { getMountPoint } from '../shared/testHelpers'
import TestEditor from './TestEditor'
import createTestEditorSession from './createTestEditorSession'

export default function setupEditor (t, ...f) {
  const editorSession = createTestEditorSession(...f)
  const configurator = editorSession.getConfigurator()
  const doc = editorSession.getDocument()
  const editor = TestEditor.mount({ editorSession }, getMountPoint(t))
  const surface = editor.refs.surface
  return { configurator, editor, editorSession, doc, surface }
}
