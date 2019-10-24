import { Command } from '../editor'

export default class ItemCommand extends Command {
  getType () {
    throw new Error('This method is abstract')
  }

  getCommandState (params) {
    const selectionState = params.selectionState
    const type = this.getType()
    if (selectionState.node && selectionState.node.type === type) {
      return { disabled: false, node: selectionState.node }
    }
    return { disabled: true }
  }
}
