import Tool from '../tools/Tool'

class InsertListTool extends Tool {
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
export default InsertListTool
