import { Component } from '../../ui'

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
