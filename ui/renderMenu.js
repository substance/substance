import { $$ } from '../dom'
import { isString } from '../util'
import Button from './Button'
import Icon from './Icon'
import MenuItem from './MenuItem'
import StackFill from './StackFill'
import HorizontalStack from './HorizontalStack'
import Separator from './Separator'
import HorizontalSpace from './HorizontalSpace'
import Dropdown from './Dropdown'

// WIP: implementing this step-by-step as we need
export default function renderMenu (requester, menuNameOrSpec, commandStates) {
  const { config, editorState } = requester.context
  if (!commandStates && editorState) {
    commandStates = editorState.commandStates
  }
  let spec
  if (isString(menuNameOrSpec)) {
    spec = config.getToolPanel(menuNameOrSpec, true)
  } else {
    spec = menuNameOrSpec
  }
  const context = { type: spec.type, size: spec.size, style: spec.style }
  switch (spec.type) {
    case 'toolbar': {
      return $$(HorizontalStack, {}, spec.items.map(itemSpec => _renderItem(requester, config, itemSpec, commandStates, context)))
    }
    default:
      if (spec.items) {
        return $$('div', {}, spec.items.map(itemSpec => _renderItem(requester, config, itemSpec, commandStates, context)))
      } else {
        return _renderItem(requester, config, spec, commandStates)
      }
  }
}

function _renderItem (requester, config, itemSpec, commandStates = {}, context = {}) {
  // Note: commands we define using a syntax like
  // { command: 'toggle-strong', icon: 'bold' }
  // i.e. no type, but with command given
  const type = _getItemType(itemSpec)
  switch (type) {
    case 'action':
    case 'url':
    case 'command': {
      const style = itemSpec.style || context.style
      const size = itemSpec.size || context.size
      const props = { style, size }
      let shortcut
      if (type === 'command') {
        const commandName = itemSpec.command
        const commandState = commandStates[commandName] || { disabled: true }
        Object.assign(props, commandState)
        const shortcutSpec = config.getKeyboardShortcutsByCommandName(commandName)
        shortcut = shortcutSpec ? shortcutSpec.label : null
        props.action = 'executeCommand'
        props.args = [commandName, { commandState }, requester.context, requester]
      } else if (type === 'action') {
        props.action = itemSpec.action
        props.args = itemSpec.args
      } else if (type === 'url') {
        props.url = itemSpec.url
        props.newTab = itemSpec.newTab
      }
      const { icon, label, tooltip } = itemSpec
      if (itemSpec.ComponentClass) {
        return $$(itemSpec.ComponentClass, Object.assign(props, { icon, label, shortcut }))
      } else if (context.type === 'menu') {
        return $$(MenuItem, Object.assign(props, { icon, label, shortcut }))
      } else {
        const buttonEl = $$(Button, props)
        if (icon) {
          buttonEl.append(
            $$(Icon, { icon: itemSpec.icon, size })
          )
        }
        if (label) {
          buttonEl.append(
            icon ? $$(HorizontalSpace) : null,
            label
          )
        }
        const title = [tooltip, shortcut].filter(Boolean).join(' ')
        if (title) {
          buttonEl.attr('title', title)
        }
        return buttonEl
      }
    }
    case 'fill': {
      return $$(StackFill)
    }
    case 'separator': {
      return $$(Separator)
    }
    case 'submenu':
    case 'menu': {
      const hasEnabledItems = _hasEnabledItems(itemSpec, commandStates)
      const menuProps = Object.assign({}, itemSpec, {
        disabled: !hasEnabledItems
      })
      if (context.type === 'menu') {
        return _renderNestedMenu(config, menuProps, commandStates, context)
      } else {
        return _renderDropdown(config, menuProps, commandStates, context)
      }
    }
    default:
      console.error('Unsupported menu item', itemSpec)
      throw new Error(`Unsupported menu item ${itemSpec.type}`)
  }
}

function _renderNestedMenu (config, itemSpec, commandStates) {
  throw new Error('TODO: implement nested menus')
}

function _renderDropdown (config, itemSpec, commandStates, context) {
  context = Object.assign({}, context, { type: 'menu' })
  const DropdownClass = itemSpec.ComponentClass || Dropdown
  return $$(DropdownClass, itemSpec)
}

function _hasEnabledItems (spec, commandStates) {
  const items = spec.items || []
  for (const item of items) {
    const type = _getItemType(item)
    switch (type) {
      case 'action':
      case 'url':
        return true
      case 'command': {
        const commandName = item.command
        const commandState = commandStates[commandName]
        if (commandState && !commandState.disabled) {
          return true
        }
        break
      }
      case 'menu':
      case 'dropdown':
      case 'submenu':
        if (_hasEnabledItems(item, commandStates)) {
          return true
        }
        break
      default:
        // nothing
    }
  }
  return false
}

function _getItemType (item) {
  if (item.type) {
    return item.type
  }
  if (item.command) {
    return 'command'
  }
  if (item.action) {
    return 'action'
  }
  if (item.url) {
    return 'url'
  }
  console.error('Unsupported item type', item)
  throw new Error('Unsupported item type')
}
