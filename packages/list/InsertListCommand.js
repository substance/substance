import Command from '../../ui/Command'

class InsertListCommand extends Command {
  getCommandState (params) {
    return {}
  }
  execute (params) {
    let ordered = this.config.ordered
    let editorSession = params.editorSession
    editorSession.transaction((tx) => {
      tx.toggleList({ ordered: ordered })
    })
  }
}

export default InsertListCommand
