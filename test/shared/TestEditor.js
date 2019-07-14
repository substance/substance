import { Component, ContainerEditor, createEditorContext } from 'substance'

export default class TestEditor extends Component {
  constructor (...args) {
    super(...args)

    let editorSession = this.props.editorSession
    let config = this.props.config
    const context = Object.assign(this.context, createEditorContext(config, editorSession, this), {
      editable: true
    })
    this.context = context
  }

  didMount () {
    this.props.editorSession.setRootComponent(this)
    this.props.editorSession.initialize()
  }

  render ($$) {
    let doc = this.props.editorSession.getDocument()
    let body = doc.get('body')
    let el = $$('div')
    el.append(
      $$(ContainerEditor, {
        containerPath: body.getContentPath(),
        name: 'body'
      }).ref('surface')
    )
    return el
  }
}
