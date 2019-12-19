import { $$, Component, domHelpers } from '../dom'
import Button from './Button'
import Icon from './Icon'
import Input from './Input'
import HorizontalStack from './HorizontalStack'

export default class MultiInput extends Component {
  getInitialState () {
    return {
      items: this.props.value ? this.props.value.slice() : ['']
    }
  }

  render () {
    const { addLabel } = this.props
    const { items } = this.state

    return $$('div', { class: 'sc-multi-input' }).append(
      ...items.map((item, idx) => {
        return $$(HorizontalStack, {},
          $$(Input, {
            value: item,
            oninput: this._updateItem.bind(this, idx),
            // Note: don't let the change event bubble up
            onchange: domHelpers.stop
          }).ref('item' + idx),
          items.length > 1
            ? $$(Button, { style: 'plain', class: 'se-remove-item' }, $$(Icon, { icon: 'trash' })).on('click', this._removeItem.bind(this, idx))
            : ''
        )
      }),
      $$(HorizontalStack, {},
        $$(Button, { style: 'plain', size: 'small', class: 'se-add-item' }, addLabel).on('click', this._addItem)
      )
    )
  }

  val () {
    return this.state.items.slice()
  }

  _emitChange () {
    this.el.emit('change', { value: this.val() })
  }

  _addItem () {
    const { items } = this.state
    const newIdx = items.length
    items.push('')
    this.rerender()
    this._emitChange()
    this.refs['item' + newIdx].focus()
  }

  _updateItem (idx) {
    const itemValue = this.refs['item' + idx].val()
    this.state.items[idx] = itemValue
    this._emitChange()
  }

  _removeItem (idx) {
    this.state.items.splice(idx, 1)
    this.rerender()
    this._emitChange()
  }
}
