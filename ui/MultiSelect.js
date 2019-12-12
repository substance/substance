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
    const { options, selected } = this.state
    const selectedOptions = options.filter(option => selected.has(option.value))

    const el = $$('div', { class: 'sc-multi-select' }).append(
      selectedOptions.map(option => {
        return $$(HorizontalStack, {},
          $$('div', { class: 'se-item' }, option.label),
          $$(Button, { style: 'plain', class: 'se-remove-item' }, $$(Icon, { icon: 'trash' })).on('click', this._onClickRemoveOption.bind(this, option))
        )
      })
    )

    if (selectedOptions.length < options.length) {
      el.append(
        $$(HorizontalStack, {},
          $$('a', { class: 'se-add-item' }, this.props.placeholder).on('click', this._onClickShowOptions)
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

  _onClickShowOptions (e) {
    domHelpers.stopAndPrevent(e)
    this._requestPopover().then(show => {
      this.extendState({ showOptions: show })
    })
  }

  _onClickRemoveOption (option, e) {
    const selected = this.state.selected
    selected.delete(option.value)
    this.extendState({ selected })
  }

  onClosePopover () {
    this.extendState({ showOptions: false })
  }

  _requestPopover () {
    const rect = this.getNativeElement().getBoundingClientRect()
    const y = rect.bottom + 5
    const x = rect.x + 0.5 * rect.width
    return this.send('requestPopover', {
      requester: this,
      desiredPos: { x, y },
      content: () => {
        return this._renderOptions()
      }
    })
  }

  _renderOptions () {
    const { options, selected } = this.state
    const notSelectedOptions = options.filter(option => !selected.has(option.value))
    return $$('div', { class: 'sc-multi-select-options' },
      notSelectedOptions.map(option => {
        const { value, label } = option
        return $$('button', { class: 'se-option' }, label).on('click', this._onAddItem.bind(this, value))
      })
    )
  }

  _onAddItem (value, e) {
    domHelpers.stopAndPrevent(e)
    const { selected } = this.state
    selected.add(value)
    this.extendState({ selected })
    // TODO: we would need a way to let the popover know
    // that we want to renew the popover
    this._requestPopover()
    this.el.emit('change')
  }
}
