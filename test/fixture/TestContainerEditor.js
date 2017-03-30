import { Component, ContainerEditor } from 'substance'

class TestContainerEditor extends Component {

  getChildContext() {
    return this.props.context
  }

  render($$) {
    return $$('div').append(
      $$(ContainerEditor, {
        node: this.props.node,
        commands: [],
        textTypes: []
      }).ref('editor')
    )
  }
}

export default TestContainerEditor
