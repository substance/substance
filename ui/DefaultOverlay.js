import Component from './Component'

/*
  A default implementation to render the content for the overlay (aka popup) toolbar.

  > TODO: be careful with the name. If it is an overlay _and_ always used to
    render tools, we should reflect this in the name (e.g. OverlayToolbar)
*/

class DefaultOverlay extends Component {

  render($$) {
    let el = $$('div').addClass(this.getClassNames())
    let commandStates = this.props.commandStates
    let tools = this.context.tools
    let overlayTools = tools.get('overlay')

    overlayTools.forEach(function(tool, name) {
      var toolProps = Object.assign({}, commandStates[name], {
        name: name,
        icon: name
      })

      if (toolProps && !toolProps.disabled) {
        el.append(
          $$(tool.Class, toolProps).ref(tool.name)
        );
      }
    });
    return el;
  }

  getClassNames() {
    return "sc-default-overlay"
  }

}

export default DefaultOverlay
