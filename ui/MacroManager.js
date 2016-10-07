class MacroManager {

  constructor(context, macros) {
    this.context = context
    this.macros = macros
    this.context.documentSession.on('update', this.onUpdate, this)
  }

  onUpdate(update, info) {
    if (update.change) {
      this.executeMacros(update, info)
    }
  }

  executeMacros(update, info) {
    let change = update.change
    if (!change) {
      return
    }
    let doc = this.context.documentSession.getDocument()
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
      selection: this.context.documentSession.getSelection()
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
