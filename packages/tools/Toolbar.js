import Toolbox from './Toolbox'

class Toolbar extends Toolbox {
  render($$) {
    let el = $$('div').addClass(this.getClassNames())
    let activeToolGroups = this.state.activeToolGroups

    activeToolGroups.forEach((toolGroup) => {
      let toolGroupProps = Object.assign({}, toolGroup, {
        toolStyle: this.getToolStyle(),
        layout: 'horizontal',
        showIcons: true
      })
      el.append(
        $$(toolGroup.Class, toolGroupProps)
      )
    })
    return el
  }

  getActiveToolGroupNames() {
    return this.props.toolGroups || ['text', 'document', 'annotations', 'default']
  }

  getClassNames() {
    return 'sc-toolbar';
  }

  getToolStyle() {
    return 'outline'
  }

  showDisabled() {
    return true
  }
}

export default Toolbar
