import Command from './Command'

class InsertNodeCommand extends Command {

  getCommandState(params) {
    let sel = params.selection
    let newState = {
      disabled: true,
      active: false
    }
    if (sel && !sel.isNull() && !sel.isCustomSelection() && sel.containerId) {
      newState.disabled = false
    }
    return newState
  }

  execute(params, context) {
    var state = params.commandState
    if (state.disabled) return
    let editorSession = this._getEditorSession(params, context)
    editorSession.transaction((tx)=>{
      let node = this.createNodeData(tx, params, context)
      tx.insertBlockNode(node)
    })
  }

  createNodeData(tx, args) { // eslint-disable-line
    throw new Error('InsertNodeCommand.createNodeData() is abstract.')
  }
}

export default InsertNodeCommand
