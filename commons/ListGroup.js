import { Component, $$ } from '../dom'
import { keys } from '../util'

export default class ListGroup extends Component {
  getInitialState () {
    return {
      selected: 0
    }
  }

  didMount () {
    const globalEventHandler = this.context.globalEventHandler
    if (globalEventHandler) {
      globalEventHandler.addEventListener('keydown', this._onKeydown, this)
    }
  }

  willReceiveProps () {
    this.setState({ selected: 0 })
  }

  dispose () {
    const globalEventHandler = this.context.globalEventHandler
    if (globalEventHandler) {
      globalEventHandler.removeEventListener(this)
    }
  }

  render () {
    const { itemClass, items } = this.props
    const { selected } = this.state
    return $$('div', { class: 'sc-list-group' },
      ...items.map((item, key) => {
        const listItem = $$(itemClass, item).on('click', this._onItemClick.bind(this, item))
        if (key === selected) listItem.addClass('sm-selected')
        return listItem
      })
    )
  }

  _onItemClick (item) {
    this.send('item:selected', item)
  }

  _onMoveUp () {
    const { selected } = this.state
    if (selected > 0) {
      this.extendState({ selected: selected - 1 })
    }
  }

  _onMoveDown () {
    const { items } = this.props
    const { selected } = this.state
    if (items.length - 1 > selected) {
      this.extendState({ selected: selected + 1 })
    }
  }

  _onSelectItem () {
    const { items } = this.props
    const { selected } = this.state
    this.send('item:selected', items[selected])
  }

  _onKeydown (event) {
    event.stopPropagation()
    switch (event.keyCode) {
      case keys.UP: {
        this._onMoveUp()
        break
      }
      case keys.DOWN: {
        this._onMoveDown()
        break
      }
      case keys.ENTER: {
        this._onSelectItem()
        break
      }
      default:
        //
    }
  }
}
