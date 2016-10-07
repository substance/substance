import Component from '../../ui/Component'
import ContainerEditor from '../../ui/ContainerEditor'

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
