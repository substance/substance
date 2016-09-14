import Component from '../../ui/Component'
import ContainerEditor from '../../ui/ContainerEditor'

class TestContainerComponent extends Component {

  render($$) {
    var el = $$('div').addClass('sc-container')
    el.append(
      $$(ContainerEditor, {
        node: this.props.node
      }).ref('editor')
    )
    return el
  }
}

TestContainerComponent.fullWidth = true

export default TestContainerComponent
