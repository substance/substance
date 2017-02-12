import { InlineNodeComponent } from '../substance'

class TestInlineNodeComponent extends InlineNodeComponent {
  didMount() {
    super.didMount()
    this.context.editorSession.onRender('document', this.rerender, this, {
      path: [this.props.node.id, 'content']
    })
  }

  dispose() {
    super.dispose()
    this.context.editorSession.off(this)
  }

  getClassNames() {
    // ATTENTION: ATM it is necessary to add .sc-inline-node
    return 'sc-test-inline sc-inline-node'
  }

  renderContent($$) {
    return $$('span').append(this.props.node.content)
  }
}

export default TestInlineNodeComponent