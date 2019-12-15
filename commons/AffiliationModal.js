import { $$, Component } from '../dom'
import { Modal, Form, FormRow, Input } from '../ui'

export default class AffiliationModal extends Component {
  getInitialState () {
    const { node } = this.props
    let data
    if (node) {
      data = {
        name: node.name || '',
        city: node.city || '',
        country: node.country || ''
      }
    } else {
      data = {
        name: '',
        city: '',
        country: ''
      }
    }

    return {
      data
    }
  }

  render (props) {
    const { mode } = this.props
    const { data } = this.state
    const title = mode === 'create' ? 'Create Affiliation' : 'Edit Affiliation'
    const confirmLabel = mode === 'edit' ? 'Update Affiliation' : 'Create Affiliation'

    const el = $$(Modal, { title, cancelLabel: 'Cancel', confirmLabel, size: 'large' })

    const form = $$(Form).append(
      // name (required)
      $$(FormRow, { label: 'Name' },
        $$(Input, { autofocus: true, value: data.name, oninput: this._updateName }).ref('name')
      ),
      // city (optional)
      $$(FormRow, { label: 'City', class: 'se-city' },
        $$(Input, { value: data.city, oninput: this._updateCity }).ref('city')
      ),
      // country (optional)
      $$(FormRow, { label: 'Country', class: 'se-country' },
        $$(Input, { value: data.country, oninput: this._updateCountry }).ref('country')
      )
    )

    el.append(form)

    return el
  }

  _updateName () {
    this.state.data.name = this.refs.name.val()
  }

  _updateCity () {
    this.state.data.city = this.refs.city.val()
  }

  _updateCountry () {
    this.state.data.country = this.refs.country.val()
  }
}
