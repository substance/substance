import EditAuthorCommand from './EditAuthorCommand'

export default class RemoveAuthorCommand extends EditAuthorCommand {
  execute (params, context) {
    const commandState = params.commandState
    const node = commandState.node
    context.api.removeAndDeleteNode(node.id)
  }
}
