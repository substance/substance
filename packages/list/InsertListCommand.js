import SwitchTextTypeCommand from '../../ui/SwitchTextTypeCommand'

class InsertListCommand extends SwitchTextTypeCommand {

  execute (params) {
    let ordered = this.config.spec.ordered
    let editorSession = params.editorSession
    editorSession.transaction((tx) => {
      tx.toggleList({ ordered: ordered })
    })
  }
}

export default InsertListCommand
