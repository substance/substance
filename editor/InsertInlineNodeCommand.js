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
    const sel = params.selection
    const newState = {
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
    const editorSession = this.getEditorSession(params, context)
    const sel = editorSession.getSelection()
    const selectionState = editorSession.getSelectionState()
    if (!sel.isPropertySelection()) {
      return true
    }
    // We don't allow inserting an inline node on top of an existing inline
    // node.
    if (selectionState.isInlineNodeSelection) {
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
    const state = params.commandState
    const editorSession = params.editorSession
    if (state.disabled) return
    editorSession.transaction((tx) => {
      const nodeData = this.createNodeData(tx, params, context)
      tx.insertInlineNode(nodeData)
    })
  }

  createNodeData (tx, params, context) { // eslint-disable-line no-unused
    throw new Error('This method is abstract')
  }
}
