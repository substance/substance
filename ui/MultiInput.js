import { $$, Component } from '../dom'
import { Button, Icon, Input, HorizontalStack } from './'

export default class MultiInput extends Component {
  didUpdate (oldProps) {
    const { value } = this.props
    const newInputAdded = value.length - oldProps.value.length === 1
    if (newInputAdded) {
      const newInput = this.refs['item' + (value.length - 1)]
      newInput.focus()
    }
  }

  render () {
    const { addLabel, value } = this.props
    const items = value.length > 0 ? value : ['']

    return $$('div', { class: 'sc-multi-input' }).append(
      ...items.map((item, idx) => {
        return $$(HorizontalStack, {},
          $$(Input, { value: item, oninput: this._updateItem.bind(this, idx) }).ref('item' + idx),
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

  _addItem () {
    const { name } = this.props
    this.send('addMultiInputItem', name)
  }

  _updateItem (idx) {
    const { name } = this.props
    const value = this.refs['item' + idx].val()
    this.send('updateMultiInputItem', name, idx, value)
  }

  _removeItem (idx) {
    const { name } = this.props
    this.send('removeMultiInputItem', name, idx)
  }
}
