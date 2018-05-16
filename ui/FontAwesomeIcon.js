import Component from './Component'

export default class FontAwesomeIcon extends Component {
  render ($$) {
    if (this.props.stack) {
      return $$('span').addClass('fa-stack')
        .append(this.props.stack.map(faClass => {
          return $$('i').addClass('fa ' + faClass + ' fa-stack')
        }))
    } else {
      return $$('i').addClass('fa ' + this.props.icon)
    }
  }
}
