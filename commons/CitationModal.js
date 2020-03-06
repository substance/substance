import { $$, Component } from '../dom'
import { Form, FormRow, Modal, MultiSelect } from '../ui'
import ReferenceModal from './ReferenceModal'

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
    const selectRefOptions = [
      { type: 'action', value: '#create', label: 'Create New Reference' }
    ].concat(
      referencesList.map(ref => {
        return { value: ref.id, label: ref.content }
      })
    )
    return $$(Modal, modalProps,
      $$(Form, {},
        $$(FormRow, {},
          $$(MultiSelect, {
            options: selectRefOptions,
            value,
            label: 'Select Reference',
            placeholder: 'Please select one or more references',
            onchange: this._onChange,
            onaction: this._onAction
          }).ref('references')
        )
      )
    )
  }

  _onChange () {
    const value = this.refs.references.val()
    this.extendState({ value })
  }

  _onAction () {
    return this.send('requestModal', () => {
      return $$(ReferenceModal, { mode: 'create', document })
    }).then(modal => {
      if (!modal) return
      const referenceData = modal.state.data
      const reference = this.context.api.addReference(referenceData)
      const newState = {
        value: this.state.value.concat([reference.id])
      }
      this.setState(newState)
    })
  }
}
