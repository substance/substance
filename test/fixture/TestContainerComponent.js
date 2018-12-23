import { Component, ContainerEditor } from 'substance'

export default class TestContainerComponent extends Component {
  render ($$) {
    let model = this.props.model
    let el = $$('div').addClass('sc-container')
    el.append(
      $$(ContainerEditor, {
        name: model.id,
        containerPath: model.getPath()
      }).ref('editor')
    )
    return el
  }

  static get fullWidth () { return true }
}
