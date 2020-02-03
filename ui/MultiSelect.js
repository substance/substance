import { $$, Component } from '../dom'
import Button from './Button'
import HorizontalStack from './HorizontalStack'
import Select from './Select'
import Icon from './Icon'

export default class MultiSelect extends Component {
  getInitialState () {
    return this._derivedState(this.props)
  }

  willReceiveProps (newProps) {
    this.setState(this._derivedState(newProps))
  }

  render () {
    const { options, value } = this.state
    const { label, placeholder } = this.props
    const selectedOptions = options.filter(option => value.has(option.value))
    const notSelectedOptions = options.filter(option => !value.has(option.value))
    const allOptionsSelected = selectedOptions.length === options.length

    const el = $$('div', { class: 'sc-multi-select' })
    if (selectedOptions.length > 0) {
      el.append(
        selectedOptions.map(option => {
          return $$(HorizontalStack, {},
            $$('div', { class: 'se-item' }, option.label),
            $$(Button, { style: 'plain', class: 'se-remove-item' }, $$(Icon, { icon: 'trash' })).on('click', this._onClickRemoveOption.bind(this, option))
          )
        })
      )
    } else if (placeholder) {
      el.append(
        $$(HorizontalStack, {},
          $$('div', { class: 'se-placeholder' }, placeholder)
        )
      )
    }

    if (!allOptionsSelected) {
      el.append(
        $$(HorizontalStack, {},
          $$(Select, { class: 'se-options', options: notSelectedOptions, placeholder: label })
            .ref('optionSelector')
            .on('change', this._onAddItem)
        )
      )
    }

    return el
  }

  val () {
    return Array.from(this.state.value)
  }

  _derivedState (props) {
    const options = props.options || []
    const value = new Set(props.value || [])
    return {
      options,
      value
    }
  }

  _renderOptions () {
    const { options, value } = this.state
    const notSelectedOptions = options.filter(option => !value.has(option.value))
    return $$(Select, { class: 'se-options', options: notSelectedOptions })
  }

  _onClickRemoveOption (option, e) {
    const value = this.state.value
    value.delete(option.value)
    this.extendState({ value })
    this.el.emit('change', { value })
  }

  _onAddItem (e) {
    e.stopPropagation()
    const itemValue = this.refs.optionSelector.val()
    const { value } = this.state
    value.add(itemValue)
    this.extendState({ value })
    this.el.emit('change', { value })
  }
}
