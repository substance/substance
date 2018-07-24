import Command from './Command'

export default class InsertNodeCommand extends Command {
  constructor (config) {
    super(config)

    // Note: we want to know about the node which this command is producing
    // For example we will inhibit commands, that produce a node type
    // not allowed in the current position
    if (!this.config.nodeType) {
      console.error("'config.nodeType' should be provided for InsertNodeCommand")
    }
  }

  getType () {
    return this.config.nodeType
  }

  getCommandState (params, context) { // eslint-disable-line no-unused
    let sel = params.selection
    let newState = {
      disabled: true,
      active: false
    }
    if (sel && !sel.isNull() && !sel.isCustomSelection() && sel.containerId) {
      newState.disabled = false
    }
    newState.showInContext = this.showInContext(sel, params, context)
    return newState
  }

  showInContext (sel, params, context) { // eslint-disable-line no-unused
    const editorSession = params.editorSession
    let selectionState = editorSession.getSelectionState()
    return sel.isCollapsed() && selectionState.isFirst && selectionState.isLast
  }

  isInsertCommand () {
    return true
  }

  execute (params, context) {
    var state = params.commandState
    if (state.disabled) return
    let editorSession = params.editorSession
    editorSession.transaction((tx) => {
      let nodeData = this.createNodeData(tx, params, context)
      let node = tx.insertBlockNode(nodeData)
      this.setSelection(tx, node)
    })
  }

  createNodeData (tx, params, context) {
    const type = params.type
    if (!type) throw new Error("'type' is mandatory")
    const editorSession = params.editorSession
    const doc = editorSession.getDocument()
    const nodeSchema = doc.getSchema().getNodeSchema(type)
    let nodeData = {type}
    for (let property of nodeSchema) {
      nodeData[property.name] = params[property.name]
    }
    return nodeData
  }

  setSelection (tx, node) {
    if (node.isText()) {
      tx.selection = {
        type: 'property',
        path: node.getPath(),
        startOffset: 0
      }
    }
  }
}
