import ValueCommand from './ValueCommand'

export default class RemoveValueCommand extends ValueCommand {
  execute (params, context) {
    const { nodeId, propertyName, valueId } = params.commandState
    context.api.removeItem([nodeId, propertyName], valueId)
  }
}
