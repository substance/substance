import Component from '../../ui/Component'

class ToolGroup extends Component {
  render($$) {
    let tools = this.props.tools
    let commandStates = this.props.commandStates
    let el = $$('div').addClass('sc-tool-group')
    el.addClass('sm-target-'+this.props.name)

    tools.forEach(function(tool, name) {
      let toolProps = Object.assign({}, commandStates[name])
      toolProps.name = name
      toolProps.icon = name
      toolProps.style = 'outline' // outline button style will be used
      el.append(
        $$(tool.Class, toolProps)
      )
    })
    return el
  }
}

export default ToolGroup
