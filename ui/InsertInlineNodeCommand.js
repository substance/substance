import Command from './Command'

/**
  Reusable command implementation for inserting inline nodes.

  @class InsertInlineNodeCommand

  @example

  Define a custom command.

  ```
  class AddXRefCommand extends InsertInlineNodeCommand {
    createNodeData() {
      return {
        attributes: {'ref-type': 'bibr'},
        targets: [],
        label: '???',
        type: 'xref'
      }
    }
  }
  ```

  Register it in your app using the configurator.

  ```
  config.addCommand('add-xref', AddXRefCommand, {nodeType: 'xref'})
  ```
*/

class InsertInlineNodeCommand extends Command {
  /**
    @param config Takes a config object, provided on registration in configurator
  */
  constructor(...args) {
    super(...args)
  }

  /**
    Determine command state for inline node insertion. Command is enabled
    if selection is a property selection.
  */
  getCommandState(params) {
    let sel = params.selection
    let newState = {
      disabled: this.isDisabled(params),
      active: false,
      showInContext: this.showInContext(sel, params)
    }
    return newState
  }

  /*
    When cursor is not collapsed tool may be displayed in context (e.g. in an
    overlay)
  */
  showInContext(sel) {
    return !sel.isCollapsed()
  }

  isDisabled(params) {
    let sel = params.selection
    let selectionState = params.editorSession.getSelectionState()
    if (!sel.isPropertySelection()) {
      return true
    }

    // We don't allow inserting an inline node on top of an existing inline
    // node.
    if (selectionState.isInlineNodeSelection()) {
      return true
    }
    return false
  }

  isAnnotationCommand() {
    return true
  }

  /**
    Insert new inline node at the current selection
  */
  execute(params) {
    let state = this.getCommandState(params)
    if (state.disabled) return
    let editorSession = this._getEditorSession(params)
    editorSession.transaction((tx) => {
      let nodeData = this.createNodeData(tx, params)
      tx.insertInlineNode(nodeData)
    })
  }

  createNodeData(tx) { // eslint-disable-line
    throw new Error('This method is abstract')
  }

}

export default InsertInlineNodeCommand
