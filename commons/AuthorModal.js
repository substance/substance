import { $$, Component, domHelpers } from '../dom'
import { Form, FormRow, Input, Modal, MultiSelect, Button, Icon, HorizontalStack } from '../ui'
import { cloneDeep } from '../util'
import OptionalFieldsToggle from './OptionalFieldsToggle'

export default class AuthorModal extends Component {
  getInitialState () {
    const { node } = this.props
    let data
    if (node) {
      data = {
        firstName: node.firstName || '',
        middleNames: node.middleNames ? node.middleNames.slice() : [''],
        lastName: node.lastName || '',
        prefix: node.prefix || '',
        suffix: node.suffix || '',
        affiliations: node.affiliations ? node.affiliations.slice() : []
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
      data,
      showOptionalFields: false
    }
  }

  render () {
    const { document, mode } = this.props
    const { showOptionalFields, data } = this.state
    const title = mode === 'create' ? 'Create Author' : 'Edit Author'
    const confirmLabel = mode === 'edit' ? 'Update Author' : 'Create Author'

    const root = document.root
    const allAffiliations = root.resolve('affiliations')

    const el = $$(Modal, { class: 'sc-author-modal', title, cancelLabel: 'Cancel', confirmLabel, size: 'large' })
    const form = $$(Form)

    // first name (required)
    form.append(
      $$(FormRow, { label: 'First Name' },
        $$(Input, { autofocus: true, value: data.firstName, oninput: this._updateFirstName }).ref('firstName')
      )
    )

    // last name (required)
    form.append(
      $$(FormRow, { label: 'Last Name' },
        $$(Input, { value: data.lastName || '', oninput: this._updateLastName }).ref('lastName')
      )
    )

    if (showOptionalFields || data.middleNames.length > 0) {
      form.append(
        $$(FormRow, { label: 'Middle Names', class: 'se-middle-names' },
          ...data.middleNames.map((middleName, idx) => {
            return $$(HorizontalStack, {},
              $$(Input, { value: middleName, oninput: this._updateMiddleName.bind(this, idx) }).ref('middleName' + idx),
              $$(Button, { style: 'plain', class: 'se-remove-item' }, $$(Icon, { icon: 'trash' })).on('click', this._removeMiddleName.bind(this, idx))
            )
          }),
          $$(HorizontalStack, {},
            $$('a', { class: 'se-add-item' }, 'Add Middle Name').on('click', this._onClickAddMiddleName)
          )
        )
      )
    }

    // prefix (optional)
    if (showOptionalFields || data.prefix) {
      form.append(
        $$(FormRow, { label: 'Prefix' },
          $$(Input, { value: data.prefix, oninput: this._updatePrefix }).ref('prefix')
        )
      )
    }

    // suffix (optional)
    if (showOptionalFields || data.suffix) {
      form.append(
        $$(FormRow, { label: 'Suffix' },
          $$(Input, { value: data.suffix, oninput: this._updateSuffix }).ref('suffix')
        )
      )
    }

    // only show this if there are any affiliations available
    if (allAffiliations.length > 0 && (showOptionalFields || data.affiliations.length > 0)) {
      form.append(
        $$(FormRow, { label: 'Affiliations' },
          $$(MultiSelect, {
            options: allAffiliations.map(aff => {
              return { value: aff.id, label: aff.name }
            }),
            selected: data.affiliations,
            placeholder: 'Select an Affiliation',
            onchange: this._updateAffiliations
          }).ref('affiliations')
        )
      )
    }

    form.append(
      $$(FormRow, {},
        $$(OptionalFieldsToggle, { showOptionalFields }).on('click', this._toggleOptionalFields)
      )
    )

    el.append(form)

    return el
  }

  _toggleOptionalFields (event) {
    domHelpers.stopAndPrevent(event)
    this.extendState({
      showOptionalFields: !this.state.showOptionalFields
    })
  }

  _onClickAddMiddleName (event) {
    domHelpers.stopAndPrevent(event)
    const data = cloneDeep(this.state.data)
    data.middleNames.push('')
    this.extendState({
      data
    })
  }

  _updatePrefix () {
    this.state.data.prefix = this.refs.prefix.val()
  }

  _updateFirstName () {
    this.state.data.firstName = this.refs.firstName.val()
  }

  _updateMiddleName (idx) {
    this.state.data.middleNames[idx] = this.refs['middleName' + idx].val()
  }

  _removeMiddleName (idx) {
    this.state.data.middleNames.splice(idx, 1)
    this.rerender()
  }

  _updateLastName () {
    this.state.data.lastName = this.refs.lastName.val()
  }

  _updateSuffix () {
    this.state.data.suffix = this.refs.suffix.val()
  }

  _updateAffiliations () {
    this.state.data.affiliations = this.refs.affiliations.getSelectedValues()
  }
}
