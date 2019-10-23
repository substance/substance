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
    const attributes = Object.assign({ class: 'sc-input' }, this.props)
    delete attributes.label
    return $$('input', attributes)
  }

  focus () {
    this.getElement().focus()
  }
}
