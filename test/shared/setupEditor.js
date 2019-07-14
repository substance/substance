import { getMountPoint } from './testHelpers'
import TestEditor from './TestEditor'
import createTestEditorSession from './createTestEditorSession'

export default function setupEditor (t, ...f) {
  const editorSession = createTestEditorSession(...f)
  const config = editorSession.getConfig()
  const doc = editorSession.getDocument()
  const editor = TestEditor.mount({ editorSession, config }, getMountPoint(t))
  const surface = editor.refs.surface
  return {
    config,
    editor,
    editorSession,
    context: editorSession.getContext(),
    doc,
    surface,
    // legacy:
    configurator: config
  }
}
