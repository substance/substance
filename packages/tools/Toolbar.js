import Component from '../../ui/Component'
import ToolGroup from './ToolGroup'

class Toolbar extends Component {
  render($$) {
    var el = $$("div").addClass(this.getClassNames())
    var commandStates = this.props.commandStates
    var componentRegistry = this.context.componentRegistry
    var toolTargets = this.context.tools
    var toolEls = []

    toolTargets.forEach(function(tools, target) {
      if (target === 'overlay') return; // skip overlay target

      var ToolTargetClass = componentRegistry.get('tool-target-'+target)
      if (!ToolTargetClass) {
        ToolTargetClass = ToolGroup
      }
      var toolTargetEl = $$(ToolTargetClass, {
        name: target,
        tools: tools,
        commandStates: commandStates
      })
      el.append(toolTargetEl)
    })
    return el
  }

  getClassNames() {
    return 'sc-toolbar';
  }
}

export default Toolbar;
