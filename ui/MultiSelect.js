import { $$, Component, domHelpers } from '../dom'
import { Button, HorizontalStack } from '../ui'
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
    const { options, selected, showOptions } = this.state
    const selectedOptions = options.filter(option => selected.has(option.value))
    const allOptionsSelected = selectedOptions.length === options.length

    const el = $$('div', { class: 'sc-multi-select' }).append(
      selectedOptions.map(option => {
        return $$(HorizontalStack, {},
          $$('div', { class: 'se-item' }, option.label),
          $$(Button, { style: 'plain', class: 'se-remove-item' }, $$(Icon, { icon: 'trash' })).on('click', this._onClickRemoveOption.bind(this, option))
        )
      })
    )

    if (!allOptionsSelected && !showOptions) {
      el.append(
        $$(HorizontalStack, {},
          $$('a', { class: 'se-add-item' }, this.props.placeholder).on('click', this._onClickShowOptions)
        )
      )
    } else if (!allOptionsSelected && showOptions) {
      el.append(
        $$(HorizontalStack, {},
          this._renderOptions().ref('optionSelector').on('input', this._onAddItem)
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
      selected,
      showOptions: false
    }
  }

  _onClickShowOptions () {
    this.extendState({ showOptions: true })
  }

  _onClickRemoveOption (option, e) {
    const selected = this.state.selected
    selected.delete(option.value)
    this.extendState({ selected })
  }

  _renderOptions () {
    const { options, selected } = this.state
    const notSelectedOptions = options.filter(option => !selected.has(option.value))
    return $$('select', { class: 'se-options' },
      $$('option', { selected: true }, this.props.placeholder),
      ...notSelectedOptions.map(option => {
        const { value, label } = option
        return $$('option', { value }, label)
      })
    )
  }

  _onAddItem () {
    const value = this.refs.optionSelector.val()
    const { selected } = this.state
    selected.add(value)
    this.extendState({ selected })
  }
}
