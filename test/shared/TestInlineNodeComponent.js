import { InlineNodeComponent, TextPropertyEditor } from 'substance'

class TestInlineNodeComponent extends InlineNodeComponent {
  getClassNames () {
    // ATTENTION: ATM it is necessary to add .sc-inline-node
    return 'sc-test-inline sc-inline-node'
  }

  renderContent ($$) {
    const node = this.props.node
    return $$('span').append(
      $$(TextPropertyEditor, {
        tagName: 'span',
        path: [node.id, 'content'],
        withoutBreak: true,
        disabled: this.isDisabled()
      }).ref('editor')
    )
  }
}

export default TestInlineNodeComponent
