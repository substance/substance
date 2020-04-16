import { $$, Component } from '../dom'
import Button from './Button'
import HorizontalStack from './HorizontalStack'
import Icon from './Icon'
import QuerySelect from './QuerySelect'

/**
 * Allows to select incrementally from either a fixed set of options
 * or from an open set via a query.
 */
export default class MultiSelect extends Component {
  getInitialState () {
    return this._derivedState(this.props)
  }

  willReceiveProps (newProps) {
    this.setState(this._derivedState(newProps))
  }

  render () {
    const { selectedItems } = this.state
    const { placeholder, queryPlaceHolder, itemRenderer, optionRenderer } = this.props

    const el = $$('div', { class: 'sc-multi-select' })
    if (selectedItems.length > 0) {
      for (const item of selectedItems) {
        const renderedItem = itemRenderer(item)
        el.append(
          $$(HorizontalStack, {},
            $$('div', { class: 'se-item' }, renderedItem),
            $$(Button, { style: 'plain', class: 'se-remove-item' },
              $$(Icon, { icon: 'trash' })
            ).on('click', this._onClickRemoveItem.bind(this, item))
          ).ref(item.id)
        )
      }
    } else if (placeholder) {
      el.append(
        $$(HorizontalStack, {},
          $$('div', { class: 'se-placeholder' }, placeholder)
        )
      )
    }

    // TODO: without any additional props it is not possible
    // to disable the select e.g. when there is no more item left ot be selected
    const querySelect = $$(QuerySelect, {
      placeholder: queryPlaceHolder,
      query: this._query.bind(this),
      optionRenderer
    }).ref('select')
      .on('change', this._onSelectItem)

    el.append(querySelect)

    return el
  }

  getValue () {
    return Array.from(this.state.selectedIds)
  }

  val () {
    return this.getValue()
  }

  _derivedState (props) {
    const selectedItems = new Set(props.selectedItems)
    const selectedIds = new Set()
    for (const item of selectedItems) {
      selectedIds.add(item.key)
    }
    return { selectedIds, selectedItems }
  }

  async _query (str) {
    // proxying queries
    const { selectedIds } = this.state
    let options = await this.props.query(str)
    options = options.filter(o => !selectedIds.has(o.id))
    return options
  }

  _onClickRemoveItem (option, e) {
    e.stopPropagation()
    const { selectedIds } = this.state
    selectedIds.delete(option.key)
    this.extendState({ selectedIds })
    this.el.emit('change', { value: this.val() })
  }

  _onSelectItem (e) {
    e.stopPropagation()
    debugger
    const { item } = e.data
    const action = item.action | 'select'
    if (action === 'select') {
      const { selectedIds, selectedItems } = this.state
      if (!selectedIds.has(item.id)) {
        selectedIds.add(item.id)
        selectedItems.add(item)
        this.extendState({ selectedIds, selectedItems })
        this.el.emit('change', { value: this.val() })
      }
    } else {
      this.el.emit('action', { item })
    }
  }
}
