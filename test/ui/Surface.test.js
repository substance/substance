import { module } from 'substance-test'

/* eslint-disable no-invalid-this */
import EditorSession from '../../model/EditorSession'
import Registry from '../../util/Registry'
import Configurator from '../../util/Configurator'

import TestContainerEditor from './TestContainerEditor'
import fixture from '../fixtures/createTestArticle'
import simple from '../fixtures/simple'
import BrowserDOMElement from '../../ui/BrowserDOMElement'

import ParagraphComponent from '../../packages/paragraph/ParagraphComponent'
import HeadingComponent from '../../packages/heading/HeadingComponent'
import AnnotationComponent from '../../ui/AnnotationComponent'
import LinkComponent from '../../packages/link/LinkComponent'

const test = module('ui/Surface')

// This test was added to cover issue #82
test.UI("Set the selection after creating annotation.", function(t) {
  window.getSelection().removeAllRanges()
  var el = t.sandbox
  var {editorSession, surface} = _createApp(simple, el)
  let sel = editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 0,
    endOffset: 5,
    surfaceId: 'body',
    containerId: 'body'
  })
  editorSession.transaction(function(tx) {
    tx.annotate({ type: "strong" })
  })
  var wsel = window.getSelection()
  var newSel = surface.domSelection.getSelection()
  t.equal(wsel.rangeCount, 1, "There should be a DOM selection.")
  t.ok(newSel.equals(sel), "New selection should be equal to initial selection.")
  t.end()
})

test.UI("Render a reverse selection.", function(t) {
  window.getSelection().removeAllRanges()
  var el = t.sandbox
  var {editorSession} = _createApp(simple, el)
  editorSession.setSelection({
    type: 'container',
    startPath:['p1', 'content'],
    startOffset: 3,
    endPath: ['p2', 'content'],
    endOffset: 2,
    reverse: true,
    containerId: 'body',
    surfaceId: 'body'
  })
  var wsel = BrowserDOMElement.getWindowSelection()
  t.ok(BrowserDOMElement.isReverse(wsel.anchorNode, wsel.anchorOffset, wsel.focusNode, wsel.focusOffset))
  t.end()
})

var componentRegistry = new Registry({
  "paragraph": ParagraphComponent,
  "heading": HeadingComponent,
  "strong": AnnotationComponent,
  "emphasis": AnnotationComponent,
  "link": LinkComponent,
})

function _createApp(fixtureSeed, el) {
  var doc = fixture(fixtureSeed)
  var editorSession = new EditorSession(doc, { configurator: new Configurator() })
  var app = TestContainerEditor.mount({
    context: {
      editorSession: editorSession,
      surfaceManager: editorSession.surfaceManager,
      componentRegistry: componentRegistry
    },
    node: doc.get('body')
  }, el)
  var surface = app.refs.editor
  return {
    editorSession: editorSession,
    doc: doc,
    surface: surface,
  }
}
