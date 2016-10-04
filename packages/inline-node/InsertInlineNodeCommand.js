import Command from '../../ui/Command'
import insertInlineNode from '../../model/transform/insertInlineNode'

/**
  Reusable command implementation for inserting inline nodes.

  @class InsertInlineNodeCommand

  @example

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

  In configurator
  ```
  config.addCommand('add-xref', AddXRefCommand, {nodeType: 'xref'})
  ```
*/

/** INCLUDE_IN_API_DOCS */
class InsertInlineNodeCommand extends Command {
  constructor(...args) {
    super(...args)

    if (!this.config.nodeType) {
      throw new Error('Every InlineInlineNodeCommand must have a nodeType')
    }
  }

  /**
    Determine command state for inline node insertion. Command is enabled
    if selection is a property selection.
  */
  getCommandState(params, context) {
    let sel = context.documentSession.getSelection()
    let newState = {
      disabled: !sel.isPropertySelection(),
      active: false
    }
    return newState
  }

  /**
    Insert new inline node at the current selection
  */
  execute(params, context) {
    let state = this.getCommandState(params, context)
    if (state.disabled) return
    let surface = context.surface || context.surfaceManager.getFocusedSurface()
    if (surface) {
      surface.transaction(function(tx, args) {
        return this.insertInlineNode(tx, args)
      }.bind(this))
    }
    return true
  }

  insertInlineNode(tx, args) {
    args.node = this.createNodeData(tx, args)
    return insertInlineNode(tx, args)
  }

  createNodeData(tx, args) { // eslint-disable-line
    return {
      type: this.config.nodeType
    }
  }

  _getAnnotationsForSelection(params) {
    return params.selectionState.getAnnotationsForType(this.config.nodeType)
  }

}

export default InsertInlineNodeCommand
