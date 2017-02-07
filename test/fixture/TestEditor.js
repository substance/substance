import AbstractEditor from '../../ui/AbstractEditor'
import ContainerEditor from '../../ui/ContainerEditor'

class TestEditor extends AbstractEditor {

  constructor(...args) {
    super(...args)
    this.handleActions({
      domSelectionRendered: function() {}
    })
  }

  render($$) {
    let doc = this.editorSession.getDocument()
    let el = $$('div')
    let body = $$(ContainerEditor, {
      node: doc.get('body')
    }).ref('surface')
    el.append(body)
    return el
  }
}

export default TestEditor