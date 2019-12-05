import { $$, Component, domHelpers } from '../dom'
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

    const el = $$('button', { class: 'sc-multi-select' })
    if (showOptions) {
      el.addClass('sm-active')
    }

    if (selectedOptions.length > 0) {
      el.append(
        $$('div', { class: 'se-preview' },
          selectedOptions.map(option => {
            return $$('div', { class: 'se-value' }, option.label)
          })
        )
      )
    } else {
      el.append(
        $$('div', { class: 'se-placeholder' }, this.props.placeholder)
      )
    }

    el.on('click', this._onClick)
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

  _onClick (e) {
    domHelpers.stopAndPrevent(e)
    this._requestPopover().then(show => {
      this.extendState({ showOptions: show })
    })
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
    return $$('div', { class: 'sc-multi-select-options' },
      options.map(option => {
        const { value, label } = option
        const isSelected = selected.has(value)
        return $$('button', { class: `se-option ${isSelected ? 'sm-selected' : ''}` },
          $$(Icon, { style: 'regular', icon: isSelected ? 'check-square' : 'square' }),
          // $$('span', { class: 'se-option-checkbox' }, isSelected ? '\u2611' : '\uf0c8'),
          $$('span', { class: 'se-option-label' },
            label
          )
        ).on('click', this._onToggleItem.bind(this, value))
      })
    )
  }

  _onToggleItem (value, e) {
    domHelpers.stopAndPrevent(e)
    const selected = this.state.selected
    if (selected.has(value)) {
      selected.delete(value)
    } else {
      selected.add(value)
    }
    this.extendState({ selected })
    // TODO: we would need a way to let the popover know
    // that we want to renew the popover
    this._requestPopover()
    this.el.emit('change')
  }
}
