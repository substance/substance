import { $$, Component } from '../dom'
import { Form, FormRow, Input, Modal, MultiInput, MultiSelect, HorizontalStack } from '../ui'
import { getLabel } from './nodeHelpers'

export default class AuthorModal extends Component {
  getInitialState () {
    const { node } = this.props
    let data
    if (node) {
      const selectedAffiliations = node.affiliations ? node.resolve('affiliations') : []
      data = {
        firstName: node.firstName || '',
        middleNames: node.middleNames && node.middleNames.length > 0 ? node.middleNames.slice() : [''],
        lastName: node.lastName || '',
        prefix: node.prefix || '',
        suffix: node.suffix || '',
        affiliations: selectedAffiliations
      }
    } else {
      data = {
        firstName: '',
        middleNames: [''],
        lastName: '',
        prefix: '',
        suffix: '',
        affiliations: []
      }
    }

    return {
      data
    }
  }

  render () {
    const { mode } = this.props
    const { data } = this.state
    const title = mode === 'create' ? 'Create Author' : 'Edit Author'
    const confirmLabel = mode === 'edit' ? 'Update Author' : 'Create Author'

    const el = $$(Modal, { class: 'sc-author-modal', title, cancelLabel: 'Cancel', confirmLabel, size: 'large' })
    const form = $$(Form).append(
      // first name (required)
      $$(FormRow, { label: 'First Name' },
        $$(Input, { autofocus: true, value: data.firstName, oninput: this._updateFirstName }).ref('firstName')
      ),
      // last name (required)
      $$(FormRow, { label: 'Last Name' },
        $$(Input, { value: data.lastName || '', oninput: this._updateLastName }).ref('lastName')
      ),
      $$(FormRow, { label: 'Middle Names', class: 'se-middle-names' },
        $$(MultiInput, { value: data.middleNames, addLabel: 'Add Middlename', onchange: this._updateMiddleNames })
      ),
      // prefix (optional)
      $$(FormRow, { label: 'Prefix' },
        $$(Input, { value: data.prefix, oninput: this._updatePrefix }).ref('prefix')
      ),
      // suffix (optional)
      $$(FormRow, { label: 'Suffix' },
        $$(Input, { value: data.suffix, oninput: this._updateSuffix }).ref('suffix')
      )
    )

    // only show this if there are any affiliations available
    const selectedAffiliations = data.affiliations.slice().sort((a, b) => getLabel(a) - getLabel(b))
    form.append(
      $$(FormRow, { label: 'Affiliations' },
        $$(MultiSelect, {
          placeholder: 'No affiliation selected.',
          selectedItems: selectedAffiliations,
          queryPlaceHolder: 'Select an affiliation or create a new one',
          query: this._queryAffiliations.bind(this),
          itemRenderer: this._renderAffiliation.bind(this),
          local: true,
          onchange: this._onAffiliationsChange,
          onaction: this._onAffiliationsAction
        }).ref('affiliations')
      )
    )

    el.append(form)

    return el
  }

  _renderAffiliation (item) {
    return $$(_AffiliationItem, { item })
  }

  _queryAffiliations (str) {
    const { document } = this.props
    const root = document.root
    const items = root.resolve('affiliations')
    let filteredItems
    // if no query string provided show all items
    if (str) {
      filteredItems = items.filter(item => item.name.indexOf(str) > -1)
    } else {
      filteredItems = items
    }
    let options = []
    if (str.length >= 3) {
      options.push(
        { action: 'create-affiliation', id: '#create', label: `Create a new affiliation "${str}"`, value: str }
      )
    }
    options = options.concat(
      filteredItems.map(item => {
        return { action: 'select', id: item.id, label: item.name, item }
      })
    )
    return options
  }

  _updateMiddleNames (event) {
    const { value } = event.detail
    this.state.data.middleNames = value
  }

  _updatePrefix () {
    this.state.data.prefix = this.refs.prefix.val()
  }

  _updateFirstName () {
    this.state.data.firstName = this.refs.firstName.val()
  }

  _updateLastName () {
    this.state.data.lastName = this.refs.lastName.val()
  }

  _updateSuffix () {
    this.state.data.suffix = this.refs.suffix.val()
  }

  _onAffiliationsChange () {
    this.state.data.affiliations = this.refs.affiliations.getValue()
    this.rerender()
  }

  _onAffiliationsAction (e) {
    e.stopPropagation()
    const option = e.detail
    switch (option.action) {
      case 'create-affiliation': {
        const affData = {
          type: 'affiliation',
          name: option.value
        }
        const aff = this.context.api.addAffiliation(affData, { select: false })
        const affiliations = this.state.data.affiliations
        affiliations.push(aff)
        this.rerender()
        this.refs.affiliations.reset()
        this.refs.affiliations.focus()
        break
      }
      default:
        console.error('Unknown action', option.action)
    }
  }
}

function _AffiliationItem (props) {
  const { item } = props
  return $$(HorizontalStack, { class: 'sc-affiliation-item' },
    $$('div', { class: 'se-label' }, '[' + getLabel(item) + ']'),
    $$('div', { class: 'se-name' }, item.name)
  )
}
