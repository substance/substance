import Component from '../../ui/Component'

class ToolGroup extends Component {
  render($$) {
    var tools = this.props.tools
    var commandStates = this.props.commandStates
    var el = $$('div').addClass('sc-tool-group')
    el.addClass('sm-target-'+this.props.name)

    tools.forEach(function(tool, name) {
      var toolProps = Object.assign({}, commandStates[name])
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

