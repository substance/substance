import Component from './Component'

/*
  @example

  ```js
  $$(Button, {
    name: 'add-ref' // used to resolve icon and label
    label: 'Add reference' // optional if you want to set the label string explicity
  })
  ```
*/
export default class Button extends Component {
  render ($$) {
    let el = $$('button')
      .addClass('sc-button')

    if (this.props.icon) {
      el.append(this.renderIcon($$))
    }
    if (this.props.label) {
      el.append(this.renderLabel($$))
    }

    if (this.props.dropdown) {
      el.append(this.renderDropdownIcon($$))
    }

    if (this.props.active) {
      el.addClass('sm-active')
    }
    if (this.props.theme) {
      el.addClass('sm-theme-' + this.props.theme)
    }

    if (this.props.disabled) {
      // make button inaccessible
      el.attr('tabindex', -1)
        .attr('disabled', true)
    } else {
      // make button accessible for tab-navigation
      el.attr('tabindex', 1)
    }

    // Ability to inject additional elements (should be avoided!)
    el.append(this.props.children)
    return el
  }

  renderIcon ($$) {
    let iconEl = this.context.iconProvider.renderIcon($$, this.props.icon)
    return iconEl
  }

  renderDropdownIcon ($$) {
    let iconEl = this.context.iconProvider.renderIcon($$, 'dropdown')
    iconEl.addClass('se-dropdown')
    return iconEl
  }

  renderLabel ($$) {
    return $$('span').addClass('se-label').append(
      this.getLabel(this.props.label)
    )
  }

  getLabel (name) {
    let labelProvider = this.context.labelProvider
    return labelProvider.getLabel(name, this.props.commandState)
  }
}
