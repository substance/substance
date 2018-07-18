import Command from '../../ui/Command'

export default class TextAlignCommand extends Command {
  getCommandState (params) {
    let sel = this._getSelection(params)
    let selectionState = params.editorSession.getSelectionState()
    let doc = params.editorSession.getDocument()
    let commandState = { disabled: true }

    if (sel.isPropertySelection() && !selectionState.isInlineNodeSelection()) {
      let path = sel.getPath()
      let node = doc.get(path[0])
      if (node && node.isText() && node.isBlock()) {
        commandState.nodeId = node.id
        commandState.disabled = false
        if (node.textAlign === this.config.textAlign) {
          commandState.active = true
        }
        // When cursor is at beginning of a text block we signal
        // that we want the tool to appear contextually (e.g. in an overlay)
        commandState.showInContext = sel.start.offset === 0 && sel.end.offset === 0
      }
    }
    return commandState
  }

  execute (params) {
    let nodeId = params.commandState.nodeId
    let editorSession = params.editorSession
    editorSession.transaction((tx) => {
      tx.set([nodeId, 'textAlign'], this.config.textAlign)
    })
  }
}
