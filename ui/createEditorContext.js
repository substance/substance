import createComponentContext from './createComponentContext'

export default function createEditorContext (config, editorSession, editor) {
  return Object.assign(createComponentContext(config), {
    config,
    editor,
    editorSession: editorSession,
    appState: editorSession.editorState,
    surfaceManager: editorSession.surfaceManager,
    markersManager: editorSession.markersManager,
    globalEventHandler: editorSession.globalEventHandler,
    keyboardManager: editorSession.keyboardManager,
    findAndReplaceManager: editorSession.findAndReplaceManager,
    // TODO: I'd like to move towards 'config', instead of configurator
    // because it is a configurator only during configuration
    // In the app we want to have a configuration.
    // FIXME: Substance.Surface assumes to find context.configurator
    configurator: config
  })
}
