import Component from '../../ui/Component'
import ToolGroup from './ToolGroup'

class Toolbar extends Component {
  render($$) {
    let el = $$("div").addClass(this.getClassNames())
    let commandStates = this.props.commandStates
    let componentRegistry = this.context.componentRegistry
    let toolTargets = this.context.tools
    let toolEls = []

    toolTargets.forEach(function(tools, target) {
      if (target === 'overlay') return; // skip overlay target

      let ToolTargetClass = componentRegistry.get('tool-target-'+target)
      if (!ToolTargetClass) {
        ToolTargetClass = ToolGroup
      }
      let toolTargetEl = $$(ToolTargetClass, {
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

export default Toolbar
