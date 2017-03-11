import Command from './Command'
import forEach from '../util/forEach'

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
    editorSession.transaction((tx) => {
      let nodeData = this.createNodeData(tx, params, context)
      let node = tx.insertBlockNode(nodeData)
      this.setSelection(tx, node)
    })
  }

  createNodeData(tx, params, context) {
    const type = params.type
    if (!type) throw new Error("'type' is mandatory")
    const doc = context.editorSession.getDocument()
    const nodeSchema = doc.getSchema().getNodeSchema(type)
    let nodeData = {type}
    forEach(nodeSchema, (key) => {
      if (params.hasOwnProperty(key)) {
        nodeData[key] = params[key]
      }
    })
    return nodeData
  }

  setSelection(tx, node) {
    if (node.isText()) {
      tx.selection = {
        type: 'property',
        path: node.getPath(),
        startOffset: 0
      }
    }
  }
}

export default InsertNodeCommand
