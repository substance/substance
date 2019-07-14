import { Component, ContainerEditor } from 'substance'

export default class TestContainerEditor extends Component {
  getChildContext () {
    return this.props.context
  }

  render ($$) {
    return $$('div').append(
      $$(ContainerEditor, {
        node: this.props.node,
        commands: []
      }).ref('editor')
    )
  }
}
