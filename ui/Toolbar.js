import Component from './Component'
import ToolGroup from './ToolGroup'

class Toolbar extends Component {
  render($$) {
    var el = $$("div").addClass(this.getClassNames())
    var commandStates = this.props.commandStates
    var tools = this.context.tools
    var toolEls = []
    var defaultTools = tools.get('default')
    defaultTools.forEach(function(tool, name) {
      if (!tool.options.overlay) {
        var toolProps = commandStates[name]
        // HACK: Also always include tool name which is equal to command name
        toolProps.name = name
        toolEls.push(
          $$(tool.Class, toolProps)
        )
      }
    })
    el.append(
      $$(ToolGroup).append(toolEls)
    )
    return el
  }

  getClassNames() {
    return 'sc-toolbar';
  }
}

export default Toolbar;
