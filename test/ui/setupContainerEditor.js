import DocumentSession from '../../model/DocumentSession'
import Component from '../../ui/Component'
import ContainerEditor from '../../ui/ContainerEditor'
import createTestArticle from '../fixtures/createTestArticle'
import createTestComponentRegistry from '../fixtures/createTestComponentRegistry'

export default function setupContainerEditor(fixture, el) {
  var doc = createTestArticle(fixture)
  var docSession = new DocumentSession(doc)
  var componentRegistry = createTestComponentRegistry()
  var App = Component.extend({
    getChildContext: function() {
      return {
        documentSession: docSession,
        document: doc,
        componentRegistry: componentRegistry
      }
    },
    render: function($$) {
      return $$('div').append($$(ContainerEditor, {
        node: doc.get('body')
      }).ref('editor'))
    },
  })
  var app
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

