import Command from './Command'

export default class IndentListCommand extends Command {
  getCommandState (params) {
    const editorSession = params.editorSession
    const doc = editorSession.getDocument()
    const sel = editorSession.getSelection()
    if (sel && sel.isPropertySelection()) {
      const path = sel.path
      const node = doc.get(path[0])
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
    const commandState = params.commandState
    const { disabled } = commandState

    if (disabled) return

    const editorSession = params.editorSession
    const action = this.config.spec.action
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
