export default class HandlerParams {
  constructor (context) {
    const editorSession = context.editorSession
    if (editorSession) {
      this.editorSession = editorSession
      this.selection = editorSession.getSelection()
      this.selectionState = editorSession.getSelectionState()
      this.surface = editorSession.getFocusedSurface()
    }
  }
}
