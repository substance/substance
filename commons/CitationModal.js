import { $$, Component } from '../dom'
import { Form, FormRow, Modal, MultiSelect, HorizontalStack } from '../ui'
import { getLabel } from './nodeHelpers'

export default class CitationModal extends Component {
  getInitialState () {
    const { mode, node } = this.props
    const selectedReferences = mode === 'edit' ? node.resolve('references') : []
    return { selectedReferences }
  }

  render () {
    const { mode } = this.props
    let { selectedReferences } = this.state
    const confirmLabel = mode === 'edit' ? 'Update' : 'Create'
    const title = mode === 'edit' ? 'Edit Citation' : 'Create Citation'
    const disableConfirm = selectedReferences.length === 0
    const modalProps = { title, cancelLabel: 'Cancel', confirmLabel, disableConfirm, size: 'large' }
    // sort refs by label
    selectedReferences = selectedReferences.slice().sort((a, b) => getLabel(a) - getLabel(b))
    return $$(Modal, modalProps,
      $$(Form, {},
        $$(FormRow, {},
          $$(MultiSelect, {
            placeholder: 'No reference selected.',
            selectedItems: selectedReferences,
            queryPlaceHolder: 'Select a reference or Create a new one',
            query: this._queryReferences.bind(this),
            itemRenderer: (item) => $$(ReferenceItem, { item }),
            autofocus: true,
            local: true,
            onchange: this._onReferencesChange,
            onaction: this._onReferencesAction
          }).ref('references')
        )
      )
    )
  }

  _queryReferences (str) {
    const { document } = this.props
    const root = document.root
    const referencesList = root.resolve('references')
    let filteredRefs
    // if no query string provided show all refs
    if (str) {
      filteredRefs = referencesList.filter(ref => ref.content.indexOf(str) > -1)
    } else {
      filteredRefs = referencesList
    }
    let options = []
    if (str.length >= 3) {
      options.push(
        { action: 'create-reference', id: '#create', label: `Create a new reference "${str}"`, value: str }
      )
    }
    options = options.concat(
      filteredRefs.map(ref => {
        return { action: 'select', id: ref.id, label: ref.content, item: ref }
      })
    )
    return options
  }

  _renderReference (ref) {
    return $$(ReferenceItem, { node: this.props.node })
  }

  _onReferencesChange () {
    const selectedReferences = this.refs.references.getValue()
    this.extendState({ selectedReferences })
  }

  _onReferencesAction (e) {
    e.stopPropagation()
    const option = e.detail
    switch (option.action) {
      case 'create-reference': {
        const refData = {
          type: 'reference',
          content: option.value
        }
        const ref = this.context.api.addReference(refData, { select: false })
        const selectedReferences = this.state.selectedReferences
        selectedReferences.push(ref)
        this.extendState({ selectedReferences })
        this.refs.references.reset()
        this.refs.references.focus()
        break
      }
      default:
        console.error('Unknown action', option.action)
    }
  }
}

function ReferenceItem (props) {
  const { item } = props
  return $$(HorizontalStack, { class: 'sc-reference-item' },
    $$('div', { class: 'se-label' }, '[' + getLabel(item) + ']'),
    $$('div', { class: 'se-content' }, item.content)
  )
}
