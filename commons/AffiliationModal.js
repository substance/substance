import { $$, Component, domHelpers } from '../dom'
import { Modal, Form, FormRow, Input, TextArea } from '../ui'
import OptionalFieldsToggle from './OptionalFieldsToggle'

export default class AffiliationModal extends Component {
  getInitialState () {
    const { node } = this.props
    let data
    if (node) {
      data = {
        name: node.name || '',
        address: node.address || '',
        city: node.city || '',
        country: node.country || ''
      }
    } else {
      data = {
        name: '',
        address: '',
        city: '',
        country: ''
      }
    }

    return {
      data,
      showOptionalFields: false
    }
  }

  render (props) {
    const { mode } = this.props
    const { showOptionalFields, data } = this.state
    const title = mode === 'create' ? 'Create Affiliation' : 'Edit Affiliation'
    const confirmLabel = mode === 'edit' ? 'Update Affiliation' : 'Create Affiliation'

    const el = $$(Modal, { title, cancelLabel: 'Cancel', confirmLabel, size: 'large' })

    const form = $$(Form)

    // name (required)
    form.append(
      $$(FormRow, { label: 'Name' },
        $$(Input, { autofocus: true, value: data.name, oninput: this._updateName }).ref('name')
      )
    )

    // address (optional)
    if (showOptionalFields || data.address) {
      form.append(
        $$(FormRow, { label: 'Address', class: 'se-address' },
          $$(TextArea, { value: data.address, rows: 3, oninput: this._updateAddress }).ref('address')
        )
      )
    }

    // city (optional)
    if (showOptionalFields || data.city) {
      form.append(
        $$(FormRow, { label: 'City', class: 'se-city' },
          $$(Input, { value: data.city, oninput: this._updateCountry }).ref('city')
        )
      )
    }

    // country (optional)
    if (showOptionalFields || data.country) {
      form.append(
        $$(FormRow, { label: 'Country', class: 'se-country' },
          $$(Input, { value: data.country, oninput: this._updateCountry }).ref('country')
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

  _updateName () {
    this.state.data.name = this.refs.name.val()
  }

  _updateAddress () {
    this.state.data.address = this.refs.address.val()
  }

  _updateCity () {
    this.state.data.city = this.refs.city.val()
  }

  _updateCountry () {
    this.state.data.country = this.refs.country.val()
  }
}
