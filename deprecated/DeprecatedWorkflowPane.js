import ToolPanel from './DeprecatedToolPanel'

export default class DeprecatedWorkflowPane extends ToolPanel {
  render ($$) {
    let el = $$('div').addClass('sc-workflow-pane')
    el.append(
      $$('div').addClass('se-active-tools').append(
        this.renderEntries($$)
      ).ref('entriesContainer')
    )
    return el
  }

  getTheme () {
    return this.props.theme || 'light'
  }
}
