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
    const { placeholder, queryPlaceHolder, itemRenderer } = this.props
    // optional props for query-select
    const { optionRenderer, local, autofocus } = this.props

    const el = $$('div', { class: 'sc-multi-select' })
    if (selectedItems.size > 0) {
      for (const item of selectedItems.values()) {
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
      optionRenderer,
      autofocus,
      local // controls how queries are debounced (faster than for remote queries)
    }).ref('querySelect')
      .on('change', this._onSelectItem)

    el.append(querySelect)

    return el
  }

  getValue () {
    return Array.from(this.state.selectedItems.values())
  }

  val () {
    return this.getValue()
  }

  reset () {
    return this.refs.querySelect.reset()
  }

  focus () {
    return this.refs.querySelect.focus()
  }

  _derivedState (props) {
    // Note: using a map here, so that there can be only one item per id
    const selectedItems = new Map()
    for (const item of props.selectedItems) {
      selectedItems.set(item.id, item)
    }
    return { selectedItems }
  }

  async _query (str) {
    // proxying queries
    const { selectedItems } = this.state
    let options = await this.props.query(str)
    options = options.filter(o => !selectedItems.has(o.id))
    return options
  }

  _onClickRemoveItem (item, e) {
    e.stopPropagation()
    const { selectedItems } = this.state
    selectedItems.delete(item.id)
    this.rerender()
    this.el.emit('change')
  }

  _onSelectItem (e) {
    e.stopPropagation()
    const option = e.detail
    const action = option.action
    switch (action) {
      case 'select': {
        const { selectedItems } = this.state
        const item = option.item
        if (!selectedItems.has(item.id)) {
          selectedItems.set(item.id, item)
          this.rerender()
          this.reset()
          this.el.emit('change')
        }
        break
      }
      default:
        this.el.emit('action', option)
    }
  }
}
