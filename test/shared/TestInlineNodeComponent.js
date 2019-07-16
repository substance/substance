import { IsolatedInlineNodeComponent, TextPropertyEditor } from 'substance'

export default class TestInlineNodeComponent extends IsolatedInlineNodeComponent {
  getClassNames () {
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
