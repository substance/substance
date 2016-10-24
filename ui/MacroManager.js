class MacroManager {

  constructor(context, macros) {
    this.context = context
    this.macros = macros
    this.context.editorSession.onFinalize(this.onUpdate, this)
  }

  dispose() {
    this.context.editorSession.off(this)
  }

  onUpdate(editorSession) {
    if (editorSession.hasChanged('change')) {
      let change = editorSession.get('change')
      let info = editorSession.get('info')
      this.executeMacros(change, info)
    }
  }

  executeMacros(change, info) {
    let doc = this.context.editorSession.getDocument()
    let nodeId, node, text
    let path
    if (info.action === 'type') {
      // HACK: we know that there is only one op when we type something
      let op = change.ops[0]
      path = op.path
      nodeId = path[0]
      node = doc.get(nodeId)
      text = doc.get(path)
    } else {
      return
    }

    let props = {
      action: info.action,
      node: node,
      path: path,
      text: text,
      selection: this.context.editorSession.getSelection()
    }
    for (let i = 0; i < this.macros.length; i++) {
      let macro = this.macros[i]
      let executed = macro.execute(props, this.context)

      if (executed) {
        break
      }
    }
  }
}

export default MacroManager
