import { Command } from '../editor'

export default class RemoveInlineNodeCommand extends Command {
  getCommandState (params) {
    const selectionState = params.selectionState
    if (selectionState.node) {
      return { disabled: false, node: selectionState.node }
    }
    return { disabled: true }
  }

  execute (params, context) {
    const commandState = params.commandState
    const node = commandState.node
    context.api.deleteNode(node.id)
  }
}
