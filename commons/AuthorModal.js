import { $$, Component, domHelpers } from '../dom'
import { Form, FormRow, Input, Modal, MultiSelect, Button } from '../ui'
import { cloneDeep } from '../util'

export default class AuthorModal extends Component {
  getInitialState () {
    const { node } = this.props
    let data
    if (node) {
      data = {
        firstName: node.firstName || '',
        middleNames: node.middleNames ? node.middleNames.slice() : [],
        lastName: node.lastName || '',
        prefix: node.prefix || '',
        suffix: node.suffix || '',
        affiliations: node.affiliations ? node.affiliations.slice() : []
      }
    } else {
      data = {
        firstName: '',
        middleNames: [],
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

    // see if there are affiliations available
    const root = document.root
    const allAffiliations = root.resolve('affiliations')

    const el = $$(Modal, { title, cancelLabel: 'Cancel', confirmLabel, size: 'medium' })
    const form = $$(Form)

    // prefix (optional)
    if (showOptionalFields || data.prefix) {
      form.append(
        $$(FormRow, { label: 'Prefix' },
          $$(Input, { value: data.prefix }).ref('prefix')
        )
      )
    }

    // first name (required)
    form.append(
      $$(FormRow, { label: 'First Name' },
        $$(Input, { autofocus: true, value: data.firstName }).ref('firstName')
      )
    )

    if (showOptionalFields || data.middleNames.length > 0) {
      form.append(
        $$(FormRow, { label: 'Middle Names' },
          ...data.middleNames.map((middleName, idx) => {
            $$(Input, { value: middleName }).ref('middleName' + idx)
          }),
          $$(Button, { icon: 'plus', onclick: this._onClickAddMiddleName })
        )
      )
    }

    // last name (required)
    form.append(
      $$(FormRow, { label: 'Last Name' },
        $$(Input, { value: data.lastName || '' }).ref('lastName')
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
            placeholder: 'Select an Affiliation'
          }).ref('affiliations')
        )
      )
    }

    form.append(
      $$(FormRow, {},
        $$(Button, {
          label: showOptionalFields ? 'Show less' : 'Show more',
          onclick: this._onClickShowMore
        })
      )
    )

    el.append(form)

    return el
  }

  _onClickShowMore (event) {
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
}
