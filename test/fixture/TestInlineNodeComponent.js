import { InlineNodeComponent, TextPropertyEditor } from 'substance'

class TestInlineNodeComponent extends InlineNodeComponent {

  getClassNames() {
    // ATTENTION: ATM it is necessary to add .sc-inline-node
    return 'sc-test-inline sc-inline-node'
  }

  renderContent($$) {
    const node = this.props.node
    // FIXME: this is not working properly
    // we should pass down `disabled: true`
    // if the node is not focused
    // But then, we can not put the selection inside
    // const disabled = this.isDisabled()
    if (this.props.node.id === 'in2') {
      console.log('in2 disabled?', this.isDisabled())
    }
    const disabled = false
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