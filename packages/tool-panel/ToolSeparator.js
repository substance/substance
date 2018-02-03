import Component from '../../ui/Component'

class ToolSeparator extends Component {
  render($$) {
    let el = $$('div').addClass('sc-tool-separator')
    return el
  }

  hasEnabledTools() {
    return false
  }
}

export default ToolSeparator
