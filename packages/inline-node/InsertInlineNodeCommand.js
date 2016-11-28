import Command from '../../ui/Command'

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

    if (!this.config.nodeType) {
      throw new Error('Every InlineInlineNodeCommand must have a nodeType')
    }
  }

  /**
    Determine command state for inline node insertion. Command is enabled
    if selection is a property selection.
  */
  getCommandState(params) {
    let sel = params.selection
    let newState = {
      disabled: !sel.isPropertySelection(),
      active: false
    }
    return newState
  }

  /**
    Insert new inline node at the current selection
  */
  execute(params) {
    let state = this.getCommandState(params)
    if (state.disabled) return
    let surface = params.surface
    if (surface) {
      surface.transaction(function(tx, args) {
        return this.insertInlineNode(tx, args)
      }.bind(this))
    }
    return true
  }

  insertInlineNode(tx, nodeData) {
    nodeData = this.createNodeData(tx, nodeData)
    return tx.insertInlineNode(nodeData)
  }

  createNodeData(tx, args) { // eslint-disable-line
    return {
      type: this.config.nodeType
    }
  }

}

export default InsertInlineNodeCommand
