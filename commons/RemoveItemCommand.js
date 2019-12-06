import ItemCommand from './ItemCommand'

export default class RemoveItemCommand extends ItemCommand {
  execute (params, context) {
    const commandState = params.commandState
    const node = commandState.node
    context.api.removeAndDeleteNode(node.id)
  }
}
