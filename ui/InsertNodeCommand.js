import forEach from '../util/forEach'
import Command from './Command'

class InsertNodeCommand extends Command {

  constructor(config) {
    super(config)

    // Note: we want to know about the node which this command is producing
    // For example we will inhibit commands, that produce a node type
    // not allowed in the current position
    if (!this.config.nodeType) {
      console.error("'config.nodeType' should be provided for InsertNodeCommand")
    }
  }

  getType() {
    return this.config.nodeType
  }

  getCommandState(params) {
    let sel = params.selection
    let newState = {
      disabled: true,
      active: false
    }
    if (sel && !sel.isNull() && !sel.isCustomSelection() && sel.containerId) {
      newState.disabled = false
    }
    newState.showInContext = this.showInContext(sel, params)
    return newState
  }

  showInContext(sel, params) {
    let selectionState = params.selectionState
    return sel.isCollapsed() && selectionState.isFirst() && selectionState.isLast()
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
