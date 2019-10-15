import { $$, Component } from '../dom'

export default class Input extends Component {
  render () {
    const attributes = Object.assign({ class: 'sc-input' }, this.props)
    delete attributes.label
    return $$('input', attributes)
  }

  focus () {
    this.getElement().focus()
  }
}
