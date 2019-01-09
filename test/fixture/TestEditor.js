import { AbstractEditor, ContainerEditor } from 'substance'

export default class TestEditor extends AbstractEditor {
  constructor (...args) {
    super(...args)
    this.handleActions({
      domSelectionRendered: function () {}
    })
  }

  render ($$) {
    let doc = this.editorSession.getDocument()
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
