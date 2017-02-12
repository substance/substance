import Component from '../../ui/Component'

/*
  @example

  ```js
  $$(Button, {
    name: 'add-ref' // used to resolve icon and label
    label: 'Add reference' // optional if you want to set the label string explicity
  })
  ```
*/
class Button extends Component {
  render($$) {
    let el = $$('button')
      .addClass('sc-button')

    if (this.props.icon) {
      el.append(this.renderIcon($$))
    }
    if (this.props.label) {
      el.append(this.renderLabel($$))
    }
    if (this.props.active) {
      el.addClass('sm-active')
    }
    if (this.props.style) {
      el.addClass('sm-style-'+this.props.style)
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

  renderIcon($$) {
    let iconEl = this.context.iconProvider.renderIcon($$, this.props.icon)
    return iconEl
  }

  renderLabel($$) {
    return $$('div').addClass('se-label').append(
      this.getLabel(this.props.label)
    )
  }

  renderHint($$) {
    return $$('div').addClass('se-hint').append(
      this.getLabel(this.props.hint+'-hint')
    )
  }

  getLabel(name) {
    let labelProvider = this.context.labelProvider
    return labelProvider.getLabel(name)
  }
}

export default Button
