class MacroManager {

  constructor(context, macros) {
    this.context = context
    this.macros = macros
    this.context.editSession.on('final', this.onUpdate, this)
  }

  dispose() {
    this.context.editSession.off(this)
  }

  onUpdate(editSession) {
    if (editSession.hasChanged('change')) {
      let change = editSession.get('change')
      let info = editSession.get('info')
      this.executeMacros(change, info)
    }
  }

  executeMacros(change, info) {
    let doc = this.context.editSession.getDocument()
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
      selection: this.context.editSession.getSelection()
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
