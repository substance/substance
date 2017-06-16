import { Component } from '../../ui'
import { orderBy } from '../../util'

/**
  Multi select component

  @class
  @component

  @prop {Array} options
  @prop {Array} selectedOptions
  @prop {Integer} maxItems

  @example

  ```js
  var select = $$(MultiSelect, {
    options: [
      { id: 'aff-1', label: 'Consortium Erudit'},
      { id: 'aff-2', label: 'PKP'},
      { id: 'aff-3', label: 'Substance Software GmbH'},
      { id: 'aff-4', label: 'Scielo'}
    ],
    selectedOptions: ['aff-3'],
    maxItems: 2
  });
  ```
*/
class MultiSelect extends Component {

  didMount() {
    this._recomputeOrder()
  }

  getInitialState() {
    return {
      options: this.props.options,
      selectedOptions: this.props.selectedOptions,
      collapsed: true
    }
  }

  render($$) {
    let options = this.state.options
    let maxItems = this.props.maxItems
    let selectedOptions = this.state.selectedOptions
    let collapsed = this.state.collapsed
    let limit = selectedOptions.length > maxItems ? selectedOptions.length : maxItems

    let el = $$('div').addClass('sc-multi-select')

    let optionsEl = options.map((option, index) => {
      if(!collapsed || index <= limit - 1) {
        let optionEl = $$('div').addClass('se-select-option')
        let icon = selectedOptions.indexOf(option.id) > -1 ? 'selected-option' : 'unselected-option'
        optionEl.append(
          this.renderIcon($$, icon).addClass('se-option-icon'),
          $$('span').addClass('se-option-label').append(option.label)
        ).on('click', this._onToggleCheckbox.bind(this, option.id))

        return optionEl
      } else {
        return ''
      }
    })

    el.append(optionsEl)

    let collapseLabelEl = $$('div').addClass('se-multi-collapse-label')

    if(collapsed) {
      let leftItems = options.length - limit
      collapseLabelEl.append(
        this.getLabel('expand-options') + ' (' + leftItems + ')'
      ).on('click', this._onToggleExpand)
    } else {
      collapseLabelEl.append(
        this.getLabel('collapse-options')
      ).on('click', this._onToggleExpand)
    }

    el.append(collapseLabelEl)

    return el
  }

  renderIcon($$, icon) {
    let iconEl = this.context.iconProvider.renderIcon($$, icon)
    return iconEl
  }

  getSelectedOptions() {
    return this.state.selectedOptions
  }

  _recomputeOrder() {
    let options = this.state.options
    let selectedOptions = this.state.selectedOptions

    let sortedOptions = orderBy(options, (option) => {
      return selectedOptions.indexOf(option.id)
    }, 'desc')

    this.extendState({options: sortedOptions})
  }

  _onToggleCheckbox(id) {
    let selectedOptions = this.state.selectedOptions
    let index = selectedOptions.indexOf(id)

    if(index > -1) {
      selectedOptions.splice(index, 1)
    } else {
      selectedOptions.push(id)
    }

    this.extendState({selectedOptions: selectedOptions})
  }

  _onToggleExpand() {
    let collapsed = this.state.collapsed

    this._recomputeOrder()
    this.extendState({collapsed: !collapsed})
  }

}

export default MultiSelect
