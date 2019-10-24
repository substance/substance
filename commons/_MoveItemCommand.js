import ItemCommand from './_ItemCommand'

export default class MoveItemCommand extends ItemCommand {
  getCommandState (params, context) {
    const commandState = super.getCommandState(params, context)
    const node = commandState.node
    if (node) {
      const { direction } = this.config
      const pos = node.getPosition()
      if (direction === 'up' && pos === 0) {
        commandState.disabled = true
      } else if (direction === 'down') {
        const { property } = node.getXpath()
        const parent = node.getParent()
        const vals = parent.get(property)
        if (vals.length - 1 === pos) {
          commandState.disabled = true
        }
      }
    }
    return commandState
  }

  execute (params, context) {
    const { node } = params.commandState
    const { direction } = this.config
    context.api.moveNode(node.id, direction)
  }
}
