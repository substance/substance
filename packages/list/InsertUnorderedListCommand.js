import Command from '../../ui/Command'

class InsertUnorderedListCommand extends Command {
  getCommandState (params) {
    return {}
  }
  execute (params) {
    let editorSession = params.editorSession
    editorSession.transaction((tx) => {
      tx.toggleList({ ordered: false })
    })
  }
}

export default InsertUnorderedListCommand
