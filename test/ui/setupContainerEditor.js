import EditorSession from '../../model/EditorSession'
import Component from '../../ui/Component'
import ContainerEditor from '../../ui/ContainerEditor'
import Configurator from '../../ui/Configurator'
import createTestArticle from '../fixtures/createTestArticle'
import createTestComponentRegistry from '../fixtures/createTestComponentRegistry'

export default function setupContainerEditor(fixture, el) {

  const doc = createTestArticle(fixture)
  const editorSession = new EditorSession(doc, { configurator: new Configurator() })
  const componentRegistry = createTestComponentRegistry()

  class App extends Component {
    getChildContext() {
      return {
        editorSession: editorSession,
        document: doc,
        componentRegistry: componentRegistry
      }
    }

    render($$) {
      return $$('div').append($$(ContainerEditor, {
        node: doc.get('body')
      }).ref('editor'))
    }
  }

  let app
  if (el) {
    app = App.mount(el)
  } else {
    app = App.render()
    // faking a mounted scenario
    app.triggerDidMount()
  }
  return {
    editorSession: editorSession,
    doc: doc,
    app: app
  }
}

