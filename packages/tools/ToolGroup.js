import Component from '../../ui/Component'

class ToolGroup extends Component {
  render($$) {

    let tools = this.props.tools
    let el = $$('div').addClass('sc-tool-group')
    el.addClass('sm-target-'+this.props.name)
    if (this.props.layout) {
      el.addClass('sm-layout-'+this.props.layout)
    }

    tools.forEach((tool) => {
      let toolProps = Object.assign({}, tool.toolProps, {
        showIcon: this.props.showIcons,
        showLabel: this.props.showLabels,
        style: this.props.toolStyle
      })
      el.append(
        $$(tool.Class, toolProps)
      )
    })
    return el
  }
}

export default ToolGroup
