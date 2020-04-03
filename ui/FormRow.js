import { Component } from '../dom'
import Explanation from './Explanation'

export default class FormRow extends Component {
  render ($$) {
    const { children, label, explanation, error } = this.props
    const el = $$('div').addClass('sc-form-row')

    if (label) {
      el.append(
        $$('div').addClass('se-description').append(
          $$('div').addClass('se-label').append(label),
          explanation ? $$(Explanation, { message: explanation }) : null,
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
