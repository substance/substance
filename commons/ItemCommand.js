import { Command } from '../editor'

export default class ItemCommand extends Command {
  getType () {
    const type = this.config.type
    if (!type) {
      // or override
      throw new Error('type is required')
    }
    return type
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
