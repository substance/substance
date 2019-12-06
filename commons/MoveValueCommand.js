import ValueCommand from './ValueCommand'

export default class MoveValueCommand extends ValueCommand {
  getCommandState (params, context) {
    const commandState = super.getCommandState(params, context)
    if (!commandState.disabled) {
      const { direction } = this.config
      const { nodeId, propertyName, valueId } = commandState
      const doc = context.api.getDocument()
      const collection = doc.get([nodeId, propertyName])
      const pos = collection.indexOf(valueId)
      if (pos < 0 || (direction === 'up' && pos === 0) || (direction === 'down' && pos === collection.length - 1)) {
        commandState.disabled = true
      }
    }
    return commandState
  }

  execute (params, context) {
    const { nodeId, propertyName, valueId } = params.commandState
    context.api.moveItem([nodeId, propertyName], valueId, this.config.direction)
  }
}
