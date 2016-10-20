import DocumentSession from '../../model/DocumentSession'
import Component from '../../ui/Component'
import ContainerEditor from '../../ui/ContainerEditor'
import createTestArticle from '../fixtures/createTestArticle'
import createTestComponentRegistry from '../fixtures/createTestComponentRegistry'

export default function setupContainerEditor(fixture, el) {

  const doc = createTestArticle(fixture)
  const docSession = new DocumentSession(doc)
  const componentRegistry = createTestComponentRegistry()

  class App extends Component {
    getChildContext() {
      return {
        editSession: docSession,
        documentSession: docSession,
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
    documentSession: docSession,
    doc: doc,
    app: app
  }
}

