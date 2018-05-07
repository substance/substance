import ToggleTool from '../../ui/ToggleTool'

expor default class InsertListTool extends ToggleTool {
  getClassNames () {
    return 'sc-insert-list-tool'
  }
  renderButton ($$) {
    let button = super.renderButton($$)
    return [ button ]
  }
  onClick () {
    this.executeCommand({
      context: this.context
    })
  }
}
