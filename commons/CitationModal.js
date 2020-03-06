import { $$, Component } from '../dom'
import { Form, FormRow, Modal, MultiSelect } from '../ui'

export default class CitationModal extends Component {
  getInitialState () {
    const { mode, node } = this.props
    const value = mode === 'edit' ? node.references.slice() : []
    return { value }
  }

  render () {
    const { document, mode } = this.props
    const { value } = this.state
    const confirmLabel = mode === 'edit' ? 'Update' : 'Create'
    const title = mode === 'edit' ? 'Edit Citation' : 'Create Citation'

    const root = document.root
    const referencesList = root.resolve('references')
    const disableConfirm = value.length === 0

    const modalProps = { title, cancelLabel: 'Cancel', confirmLabel, disableConfirm, size: 'large' }
    return $$(Modal, modalProps,
      $$(Form, {},
        $$(FormRow, {},
          $$(MultiSelect, {
            options: referencesList.map(ref => {
              return { value: ref.id, label: ref.content }
            }),
            value,
            label: 'Select Reference',
            placeholder: 'Please select one or more references',
            onchange: this._updateReferencess
          }).ref('references')
        )
      )
    )
  }

  _updateReferencess () {
    const value = this.refs.references.val()
    this.extendState({ value })
  }
}
