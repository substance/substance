import createComponentContext from './createComponentContext'

export default function createEditorContext (config, editorSession) {
  return Object.assign(createComponentContext(config), {
    config,
    editorSession: editorSession,
    surfaceManager: editorSession.surfaceManager,
    markersManager: editorSession.markersManager,
    globalEventHandler: editorSession.globalEventHandler,
    keyboardManager: editorSession.keyboardManager,
    findAndReplaceManager: editorSession.findAndReplaceManager
  })
}
