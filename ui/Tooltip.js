import Component from './Component'

class Tooltip extends Component {
  render($$) {
    let el = $$('div').addClass('sc-tooltip')
    el.append(this.props.text)
    return el
  }
}

export default Tooltip
