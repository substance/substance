import { Component, ContainerEditor } from 'substance'

export default class TestContainerComponent extends Component {
  render ($$) {
    let node = this.props.node
    let el = $$('div').addClass('sc-container')
    el.append(
      $$(ContainerEditor, {
        name: node.id,
        containerPath: node.getPath()
      }).ref('editor')
    )
    return el
  }

  static get fullWidth () { return true }
}
