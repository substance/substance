import Command from '../../ui/Command'

class InsertOrderedListCommand extends Command {
  getCommandState (params) {
    return {}
  }
  execute (params) {
    let editorSession = params.editorSession
    editorSession.transaction((tx) => {
      tx.toggleList({ ordered: true })
    })
  }
}

export default InsertOrderedListCommand
