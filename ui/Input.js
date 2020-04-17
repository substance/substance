import { $$, Component } from '../dom'
import { platform } from '../util'

export default class Input extends Component {
  didMount () {
    // HACK: for whatever reason, the native autofocus does not work
    // after the first time. This forces focus if autofocus is set
    if (this.el.getAttribute('autofocus') === 'true') {
      this.el.focus()
      // put the cursor at the end
      if (platform.inBrowser) {
        const val = this.el.val()
        if (val) {
          this.el.getNativeElement().setSelectionRange(0, val.length)
        }
      }
    }
  }

  render () {
    return $$(this._getTagname(), this._getProps())
  }

  focus () {
    this.getElement().focus()
  }

  _getTagname () {
    return 'input'
  }

  _getClass () {
    return 'sc-input'
  }

  _getProps () {
    const attributes = Object.assign({ class: this._getClass() }, this.props)
    // delete the placeholder attribute if it is nil
    if (!attributes.placeholder) delete attributes.placeholder
    delete attributes.label
    return attributes
  }
}
