import { Command } from '../editor'

export default class ValueCommand extends Command {
  getPropertySelector () {
    const propertySelector = this.config.propertySelector
    if (!propertySelector) {
      // either provide a selector via config, or override
      throw new Error('propertySelector is required')
    }
    return propertySelector
  }

  getCommandState (params) {
    const selectionState = params.selectionState
    const sel = selectionState.selection
    const propSelector = this.getPropertySelector()
    if (sel && sel.customType === 'value') {
      if (`${selectionState.node.type}.${sel.data.property}` === propSelector) {
        return { disabled: false, nodeId: sel.nodeId, propertyName: sel.data.property, valueId: sel.data.valueId }
      }
    }
    return { disabled: true }
  }
}
