import { $$, Component } from '../dom'
import { Button, HorizontalStack, Select } from '../ui'
import Icon from './Icon'

export default class MultiSelect extends Component {
  getInitialState () {
    return this._derivedState(this.props)
  }

  willReceiveProps (newProps) {
    this.setState(this._derivedState(newProps))
  }

  getSelectedValues () {
    return Array.from(this.state.selected)
  }

  render () {
    const { options, selected } = this.state
    const selectedOptions = options.filter(option => selected.has(option.value))
    const notSelectedOptions = options.filter(option => !selected.has(option.value))
    const allOptionsSelected = selectedOptions.length === options.length

    const el = $$('div', { class: 'sc-multi-select' }).append(
      selectedOptions.map(option => {
        return $$(HorizontalStack, {},
          $$('div', { class: 'se-item' }, option.label),
          $$(Button, { style: 'plain', class: 'se-remove-item' }, $$(Icon, { icon: 'trash' })).on('click', this._onClickRemoveOption.bind(this, option))
        )
      })
    )

    if (!allOptionsSelected) {
      el.append(
        $$(HorizontalStack, {},
          $$(Select, { class: 'se-options', options: notSelectedOptions, placeholder: this.props.placeholder })
            .ref('optionSelector').on('input', this._onAddItem)
        )
      )
    }

    return el
  }

  _derivedState (props) {
    const options = this.props.options || []
    const selected = new Set(this.props.selected || [])
    return {
      options,
      selected
    }
  }

  _onClickRemoveOption (option, e) {
    const selected = this.state.selected
    selected.delete(option.value)
    this.extendState({ selected })
  }

  _renderOptions () {
    const { options, selected } = this.state
    const notSelectedOptions = options.filter(option => !selected.has(option.value))
    return $$(Select, { class: 'se-options', options: notSelectedOptions })
  }

  _onAddItem () {
    const value = this.refs.optionSelector.val()
    const { selected } = this.state
    selected.add(value)
    this.extendState({ selected })
  }
}
