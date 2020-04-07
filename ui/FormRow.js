import { Component } from '../dom'
import Icon from './Icon'

export default class FormRow extends Component {
  render ($$) {
    const { children, label, error } = this.props
    const el = $$('div').addClass('sc-form-row')
    if (label) {
      const labelEl = $$('div').addClass('se-label').append(label)
      let errorEl = null
      if (error) {
        errorEl = $$('div').addClass('se-error').append(error.message)
        if (error.explanation) {
          errorEl.append(' ', $$(Icon, { icon: 'question-circle' }))
          errorEl.setAttribute('title', error.explanation)
        }
      }

      el.append(
        $$('div').addClass('se-description').append(
          labelEl,
          errorEl
        )
      )
    }
    if (error) {
      el.addClass('sm-error')
    }
    el.append(
      $$('div').addClass('se-content').append(children)
    )
    return el
  }
}
