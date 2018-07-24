import Command from '../../ui/Command'

export default class IndentListCommand extends Command {
  getCommandState (params) {
    let editorSession = params.editorSession
    let doc = editorSession.getDocument()
    let sel = editorSession.getSelection()
    if (sel && sel.isPropertySelection()) {
      let path = sel.path
      let node = doc.get(path[0])
      if (node) {
        if (node.isListItem()) {
          return {
            disabled: false
          }
        }
      }
    }
    return { disabled: true }
  }

  execute (params) {
    let commandState = params.commandState
    const { disabled } = commandState

    if (disabled) return

    let editorSession = params.editorSession
    let action = this.config.spec.action
    switch (action) {
      case 'indent': {
        editorSession.transaction((tx) => {
          tx.indent()
        }, { action: 'indent' })
        break
      }
      case 'dedent': {
        editorSession.transaction((tx) => {
          tx.dedent()
        }, { action: 'dedent' })
        break
      }
      default:
        //
    }
  }
}
