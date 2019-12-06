import ValueCommand from './ValueCommand'

export default class JumpToItemCommand extends ValueCommand {
  execute (params, context) {
    const { valueId } = params.commandState
    context.api.selectItem(valueId)
  }
}
