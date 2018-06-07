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

export default class InsertInlineNodeCommand extends Command {
  /**
    Determine command state for inline node insertion. Command is enabled
    if selection is a property selection.
  */
  getCommandState (params, context) {
    let sel = params.selection
    let newState = {
      disabled: this.isDisabled(params, context),
      active: false,
      showInContext: this.showInContext(sel, params, context)
    }
    return newState
  }

  /*
    When cursor is not collapsed tool may be displayed in context (e.g. in an
    overlay)
  */
  showInContext (sel, context) { // eslint-disable-line no-unused
    return !sel.isCollapsed()
  }

  isDisabled (params, context) { // eslint-disable-line no-unused
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

  /*
    This is needed in order for SchemaDrivenCommandManager to categorise the
    the command.
  */
  isAnnotationCommand () {
    return true
  }

  /**
    Insert new inline node at the current selection
  */
  execute (params, context) {
    let state = this.getCommandState(params, context)
    if (state.disabled) return
    let editorSession = this._getEditorSession(params, context)
    editorSession.transaction((tx) => {
      let nodeData = this.createNodeData(tx, params, context)
      tx.insertInlineNode(nodeData)
    })
  }

  createNodeData (tx, params, context) { // eslint-disable-line no-unused
    throw new Error('This method is abstract')
  }
}
