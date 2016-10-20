import Component from '../../ui/Component'
import isEqual from 'lodash/isEqual'

class ContextMenu extends Component {

  constructor(...args) {
    super(...args)
  }

  /*
    Override with custom rendering
  */
  render($$) {
    let el = $$('div').addClass('sc-context-menu sm-hidden')

    let activeTools = this.state.activeTools

    if (activeTools.length > 0) {
      let toolsEl = $$('div').addClass('se-active-tools')
      activeTools.forEach(tool => {
        toolsEl.append(
          $$(tool.Class, tool.toolProps).ref(tool.toolProps.name)
        )
      })
      el.append(toolsEl)
    }
    return el
  }

  getInitialState() {
    return {
      activeTools: this.getActiveTools()
    }
  }

  shouldRerender(newProps, newState) {
    // poor-man's immutable style
    let hasChanged = !isEqual(this.props, newProps) || !isEqual(this.state.activeTools, newState.activeTools)

    if (!hasChanged) {
      this.hide()
      return false
    }
    return true
  }

  didMount() {
    // rerender the context menu after anything else has been updated
    this.context.editSession.on('render', this._onCommandStatesChanged, this)
  }

  dispose() {
    this.context.editSession.off(this)
  }

  show(hints) {
    this.el.removeClass('sm-hidden')
    this._position(hints)
  }

  hide() {
    this.el.addClass('sm-hidden')
  }

  _onCommandStatesChanged(editSession) {
    if (editSession.hasChanged('commandStates')) {
      this.setState({
        activeTools: this.getActiveTools()
      })
    }
  }

  /*
    Override with your own implementation
  */
  getActiveTools() {
    let commandStates = this._getCommandStates()
    let tools = this.context.tools
    let contextMenuTools = tools.get('context-menu')
    let activeTools = []

    contextMenuTools.forEach((tool, toolName) => {
      let toolProps = Object.assign({}, commandStates[toolName], {
        name: toolName,
        label: toolName,
        // rendering hints only interprerted by generic Tool class
        // (= outlined button)
        style: this.getToolStyle(toolName)
      })

      activeTools.push({
        Class: tool.Class,
        toolProps: toolProps
      })
    })
    return activeTools
  }

  /*
    Override if you just want to use a different style
  */
  getToolStyle() {
    return 'plain-dark'
  }

  _getCommandStates() {
    return this.context.commandManager.getCommandStates()
  }

  _position(hints) {
    if (hints) {
      let contentWidth = this.el.htmlProp('offsetWidth')

      // By default, context menu are aligned left bottom to the mouse coordinate clicked
      this.el.css('top', hints.top)
      let leftPos = hints.left
      // Must not exceed left bound
      leftPos = Math.max(leftPos, 0)
      // Must not exceed right bound
      let maxLeftPos = hints.left + hints.right - contentWidth
      leftPos = Math.min(leftPos, maxLeftPos)
      this.el.css('left', leftPos)
    }
  }

}

export default ContextMenu
