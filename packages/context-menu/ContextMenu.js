import Component from '../../ui/Component'


class ContextMenu extends Component {
  constructor(...args) {
    super(...args)
  }

  // TODO: remove hard-coded bits and introduce tool group 'contextual'
  getActiveTools() {
    let commandStates = this._getCommandStates()
    let tools = this.context.tools
    let contextMenuTools = tools.get('context-menu')
    let activeTools = []

    contextMenuTools.forEach((tool, toolName) => {
      let toolProps = Object.assign({}, commandStates[toolName], {
        name: toolName,
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

  getToolStyle() {
    return 'plain-dark'
  }

  render($$) {
    let el = $$('div').addClass('sc-context-menu sm-hidden')

    let activeTools = this.getActiveTools()

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

  didMount() {
    // rerender the context menu after anything else has been updated
    this.context.documentSession.on('didUpdate', this._onSessionDidUpdate, this)
  }

  dispose() {
    this.context.documentSession.off(this)
  }

  show(hints) {
    this.el.removeClass('sm-hidden')
    this._position(hints)
  }

  hide() {
    this.el.addClass('sm-hidden')
  }

  _onSessionDidUpdate() {
    if (this.shouldRerender()) {
      this.rerender() // also hides it!
    }
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
