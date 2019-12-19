import { $$, Component } from '../dom'
import { Form, FormRow, Input, Modal, MultiInput, MultiSelect } from '../ui'

export default class AuthorModal extends Component {
  getInitialState () {
    const { node } = this.props
    let data
    if (node) {
      data = {
        firstName: node.firstName || '',
        middleNames: node.middleNames && node.middleNames.length > 0 ? node.middleNames.slice() : [''],
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
      data
    }
  }

  render () {
    const { document, mode } = this.props
    const { data } = this.state
    const title = mode === 'create' ? 'Create Author' : 'Edit Author'
    const confirmLabel = mode === 'edit' ? 'Update Author' : 'Create Author'

    const root = document.root
    const allAffiliations = root.resolve('affiliations')

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
        $$(MultiInput, {
          value: data.middleNames,
          addLabel: 'Add Middlename',
          onchange: this._updateMiddleNames.bind(this)
        })
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
    if (allAffiliations.length > 0) {
      form.append(
        $$(FormRow, { label: 'Affiliations' },
          $$(MultiSelect, {
            options: allAffiliations.map(aff => {
              return { value: aff.id, label: aff.name }
            }),
            selected: data.affiliations,
            placeholder: 'Add Affiliation',
            onchange: this._updateAffiliations
          }).ref('affiliations')
        )
      )
    }

    el.append(form)

    return el
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

  _updateAffiliations () {
    this.state.data.affiliations = this.refs.affiliations.getSelectedValues()
  }
}
