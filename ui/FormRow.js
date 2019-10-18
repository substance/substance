import { Component } from '../dom'

export default class FormRow extends Component {
  render ($$) {
    const label = this.props.label
    const error = this.props.error
    const children = this.props.children
    const el = $$('div').addClass('sc-form-row')

    if (label) {
      el.append(
        $$('div').addClass('se-description').append(
          $$('div').addClass('se-label').append(label),
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
