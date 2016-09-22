import Component from './Component'

class FontAwesomeIcon extends Component {
  constructor(...args) {
    super(...args)
  }

  render($$) {
    return $$('i').addClass('fa ' + this.props.icon)
  }

}

export default FontAwesomeIcon
