import Component from './Component'

class Tooltip extends Component {
  render($$) {
    let el = $$('div').addClass('sc-tooltip')
    let labelProvider = this.context.labelProvider
    let label = labelProvider.getLabel(this.props.name)
    el.append(label)
    return el
  }
}

export default Tooltip
