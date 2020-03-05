import { $$, Component } from '../dom'
import { Modal, Form, FormRow, Input } from '../ui'

export default class ReferenceModal extends Component {
  getInitialState () {
    return {
      data: {
        content: ''
      }
    }
  }

  render () {
    const { data } = this.state
    return $$(Modal, { title: 'Create Reference', size: 'large', cancelLabel: 'Cancel', confirmLabel: 'Create Reference' },
      $$(Form, {},
        $$(FormRow, {},
          $$(Input, { value: data.content, autofocus: true, placeholder: 'Describe your reference', oninput: this._updateContent }).ref('content')
        )
      )
    ).addClass('sc-reference-modal')
  }

  _updateContent () {
    this.state.data.content = this.refs.content.val()
  }
}
