import Component from '../../ui/Component'

class ToolDropdown extends Component {
  render($$) {
    var el = $$('div').addClass('sc-tool-dropdown')
    el.append(this.renderButton($$))

    el.append(
      $$('div').addClass('se-options').append(
        this.props.children
      )
    )
    return el
  }

  renderButton($$) {
    var button = $$('button')
      .on('click', this.onClick)
      .append(this.renderIcon($$))

    // TODO: Not sure this really works
    if (this.props.disabled) {
      // make button inaccessible
      button.attr('tabindex', -1).attr('disabled', true)
    } else {
      // make button accessible for tab-navigation
      button.attr('tabindex', 1)
    }
    return button;
  }

  onClick() {
    console.log('TODO: handle click');
  }

  renderIcon($$) {
    var dropdownName = this.props.name;
    debugger;
    var iconEl = this.context.iconProvider.renderIcon($$, dropdownName)
    return iconEl
  }
}

export default ToolDropdown