import Component from '../ui/Component'

export default class DeprecatedToolSeparator extends Component {
  render ($$) {
    let el = $$('div').addClass('sc-tool-separator')
    return el
  }

  hasEnabledTools () {
    return false
  }
}
