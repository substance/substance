import DropdownMenu from './DropdownMenu'

export default class SwitchTextTypeDropdown extends DropdownMenu {
  _getToggleButtonProps () {
    const props = super._getToggleButtonProps()
    const activeItem = this._getActiveItem()
    if (activeItem) {
      props.label = activeItem.label
    }
    props.tooltip = 'Switch Type'
    props.size = 'small'
    return props
  }

  _getActiveItem () {
    const editorState = this.context.editorState
    const commandStates = editorState.commandStates
    if (commandStates) {
      for (const item of this.props.items) {
        const commandState = commandStates[item.command]
        if (commandState && commandState.active) {
          return item
        }
      }
    }
  }
}
