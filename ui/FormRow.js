import { Component } from '../dom'
import Icon from './Icon'

export default class FormRow extends Component {
  render ($$) {
    const { children, label, explanation, error } = this.props
    const el = $$('div').addClass('sc-form-row')

    if (label) {
      const labelEl = $$('div').addClass('se-label').append(label)
      // Shows a question mark and a help message on hover
      // TODO: in future we will probably want to render message in popover
      if (explanation) {
        labelEl.append(
          $$('div', { class: 'se-explanation' },
            $$(Icon, { icon: 'question-circle' })
          )
        ).setAttribute('title', explanation)
      }

      el.append(
        $$('div').addClass('se-description').append(
          labelEl,
          error ? $$('div').addClass('se-error').append(error) : null
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
