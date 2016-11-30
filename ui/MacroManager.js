class MacroManager {

  constructor(context, macros) {
    this.context = context
    this.macros = macros
    this.context.editorSession.onFinalize('document', this.onDocumentChanged, this)
  }

  dispose() {
    this.context.editorSession.off(this)
  }

  onDocumentChanged(change, info) {
    this.executeMacros(change, info)
  }

  executeMacros(change, info) {
    let doc = this.context.editorSession.getDocument()
    let nodeId, node, text, start, end
    let path
    // HACK: we exploit the information of the internal structure
    // of this document changes
    switch(info.action) {
      case 'type': {
        let op = change.ops[0]
        if (op.type === 'update' && op.diff.propertyType === 'string') {
          path = op.path
          nodeId = path[0]
          node = doc.get(nodeId)
          text = doc.get(path)
          start = op.diff.pos
          end = start+op.diff.getLength()
        }
        break
      }
      case 'break': {
        // We interpret a 'break' as kind of confirmation
        // of the current node
        // so we take the original selection
        // to determine the original node
        let sel = change.before.selection
        if (!sel.isPropertySelection()) return
        path = sel.path
        nodeId = path[0]
        node = doc.get(nodeId)
        if (!node.isText()) return
        text = node.getText()
        start = sel.getStartOffset()
        end = start
        break
      }
      default:
        return
    }

    let props = {
      action: info.action,
      node: node,
      path: path,
      text: text,
      start: start,
      end: end,
      editorSession: this.context.editorSession,
      selection: this.context.editorSession.getSelection()
    }

    setTimeout(() => {
      for (let i = 0; i < this.macros.length; i++) {
        let macro = this.macros[i]
        let executed = macro.execute(props, this.context)
        if (executed) {
          break
        }
      }
    })

  }
}

export default MacroManager
