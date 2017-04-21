import { Component } from '.'

/*
  Renders a toolgroup as a choice (dropdown)

  NOTE: To work correctly only one tool at a time should be active in the group
*/
class ChoiceToolGroup extends Component {
  /*
    Make sure the dropdown is closed each time we receive new props
  */
  willReceiveProps() {
    this.setState({showChoices: false})
  }

  render($$) {
    let Button = this.getComponent('button')
    let tools = this.props.tools
    let activeTool = this.getActiveTool()
    let el = $$('div').addClass('sc-choice-tool-group')
    el.addClass('sm-target-'+this.props.name)

    if (!activeTool) {
      return el
    }

    let toggleButton = $$(Button, {
      icon: activeTool.name,
      // active: this.props.active,
      // disabled: this.props.disabled,
      style: this.props.toolStyle
    }).on('click', this._toggleChoices)

    el.append(toggleButton)

    let choices = $$('div').addClass('se-choices')

    tools.forEach((tool) => {
      let toolProps = Object.assign({}, tool.toolProps, {
        // showIcon: this.props.showIcons,
        showLabel: true,
        style: this.props.toolStyle
      })
      choices.append(
        $$(tool.Class, toolProps).ref(tool.name)
      )
    })

    if (this.state.showChoices) {
      el.append(choices)
    }
    return el
  }

  _toggleChoices() {
    this.setState({
      showChoices: !(this.state.showChoices)
    })
  }

  /*
    Finds the currently active tool (current choice)
  */
  getActiveTool() {
    let activeTool
    this.props.tools.forEach((tool) => {
      if (tool.toolProps.active && !activeTool) {
        activeTool = tool
      }
    })
    return activeTool
  }


}

export default ChoiceToolGroup
