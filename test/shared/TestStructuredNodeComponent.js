import { Component, TextPropertyEditor, ContainerEditor } from 'substance'

export default class TestStructuredNodeComponent extends Component {
  render ($$) {
    var node = this.props.node
    var el = $$('div').addClass('sc-structured-node')
    el.append(
      $$(TextPropertyEditor, {
        disabled: this.props.disabled,
        path: [node.id, 'title']
      }).ref('titleEditor')
    )
    el.append(
      $$(ContainerEditor, {
        disabled: this.props.disabled,
        containerPath: [node.id, 'body']
      }).ref('bodyEditor')
    )
    el.append(
      $$(TextPropertyEditor, {
        disabled: this.props.disabled,
        path: [node.id, 'caption']
      }).ref('captionEditor')
    )
    return el
  }
}

TestStructuredNodeComponent.fullWidth = true
