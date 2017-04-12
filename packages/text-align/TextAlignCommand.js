import { Command } from '../../ui'

class TextAlignCommand extends Command {
  getCommandState (params) {
    let sel = this._getSelection(params)
    let selectionState = params.editorSession.getSelectionState()
    let doc = params.editorSession.getDocument()
    let commandState = { disabled: false }
    let _disabledCollapsedCursor = this.config.disableCollapsedCursor && sel.isCollapsed()
    if (_disabledCollapsedCursor || !sel.isPropertySelection() || selectionState.isInlineNodeSelection()) {
      commandState.disabled = true
    } else {
      let path = sel.getPath()
      let node = doc.get(path[0])
      if (node && node.isText() && node.isBlock()) {
        commandState.node = node
      } else {
        commandState.disabled = true
      }
    }

    return commandState
  }
  execute (params) {
    let node = params.commandState.node
    let textAlign = params.textAlign
    let editorSession = params.editorSession
    editorSession.transaction((tx) => {
      tx.set([node.id, 'textAlign'], textAlign)
    })
  }
}

export default TextAlignCommand
