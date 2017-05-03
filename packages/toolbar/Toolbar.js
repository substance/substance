import { ToolPanel } from '../../ui'

class Toolbar extends ToolPanel {

  render($$) {
    let el = $$('div').addClass('sc-toolbar')
    el.append(
      $$('div').addClass('se-active-tools').append(
        this.renderEntries($$)
      ).ref('entriesContainer')
    )
    return el
  }

  getTheme() {
    return this.props.theme || 'light'
  }
}

export default Toolbar
