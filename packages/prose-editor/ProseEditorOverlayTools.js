import Component from '../../ui/Component'

/*
  A default implementation to render the content for the overlay (aka popup) tools.
*/
class ProseEditorOverlayTools extends Component {

  /*
    NOTE: overlay gets only shown when el.childNodes.length > 0
    See OverlayContainer
  */
  render($$) {
    let el = $$('div').addClass(this.getClassNames())
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

  getActiveTools() {
    let commandStates = this.props.commandStates
    let tools = this.context.tools
    let overlayTools = tools.get('overlay')
    let activeTools = []

    overlayTools.forEach((tool, toolName) => {
      let toolProps = Object.assign({}, commandStates[toolName], {
        name: toolName,
        // rendering hints only interprerted by generic Tool class
        // (= outlined button)
        icon: toolName,
        style: this.getStyle()
      })

      if (!toolProps.disabled) {
        activeTools.push({
          Class: tool.Class,
          toolProps: toolProps
        })
      }
    })
    return activeTools
  }

  isVisible() {
    return this.getActiveTools().length > 0
  }

  getStyle() {
    return 'outline-dark'
  }

  getClassNames() {
    return 'sc-prose-editor-overlay-tools'
  }

}

export default ProseEditorOverlayTools
