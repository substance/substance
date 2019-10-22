import { $$, Component } from '../dom'

export default class Input extends Component {
  didMount () {
    // HACK: for whatever reason, the native autofocus does not work
    // after the first time. This forces focus if autofocus is set
    if (this.el.getAttribute('autofocus') === 'true') {
      this.el.focus()
    }
  }

  render () {
    const attributes = Object.assign({ class: 'sc-input' }, this.props)
    delete attributes.label
    return $$('input', attributes)
  }

  focus () {
    this.getElement().focus()
  }
}
