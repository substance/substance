import { module } from 'substance-test'

/* eslint-disable no-invalid-this */
import Registry from '../../util/Registry'
import createAnnotation from '../../model/transform/createAnnotation'
import DocumentSession from '../../model/DocumentSession'
import SurfaceManager from '../../ui/SurfaceManager'

import TestContainerEditor from './TestContainerEditor'
import fixture from '../fixtures/createTestArticle'
import simple from '../fixtures/simple'
import BrowserDOMElement from '../../ui/BrowserDOMElement'

import ParagraphComponent from '../../packages/paragraph/ParagraphComponent'
import HeadingComponent from '../../packages/heading/HeadingComponent'
import AnnotationComponent from '../../ui/AnnotationComponent'
import LinkComponent from '../../packages/link/LinkComponent'

const test = module('ui/Surface')

var componentRegistry = new Registry({
  "paragraph": ParagraphComponent,
  "heading": HeadingComponent,
  "strong": AnnotationComponent,
  "emphasis": AnnotationComponent,
  "link": LinkComponent,
})

function _createApp(fixtureSeed, el) {
  var doc = fixture(fixtureSeed)
  var documentSession = new DocumentSession(doc)
  var surfaceManager = new SurfaceManager(documentSession)
  var app = TestContainerEditor.mount({
    context: {
      documentSession: documentSession,
      surfaceManager: surfaceManager,
      componentRegistry: componentRegistry
    },
    node: doc.get('body')
  }, el)
  var surface = app.refs.editor
  return {
    documentSession: documentSession,
    doc: doc,
    surface: surface,
  }
}

// This test was added to cover issue #82
test.UI("Set the selection after creating annotation.", function(t) {
  var el = t.sandbox
  var app = _createApp(simple, el)
  var doc = app.doc
  var surface = app.surface
  var sel = doc.createSelection(['p1', 'content'], 0, 5)
  surface.transaction(function(tx, args) {
    args.selection = sel
    args.node = {type: "strong"}
    return createAnnotation(tx, args)
  })
  var wsel = window.getSelection()
  var newSel = surface.domSelection.getSelection()
  t.equal(wsel.rangeCount, 1, "There should be a DOM selection.")
  t.ok(newSel.equals(sel), "New selection should be equal to initial selection.")
  t.end()
})

test.UI("Render a reverse selection.", function(t) {
  var el = t.sandbox
  var app = _createApp(simple, el)
  var doc = app.doc
  var surface = app.surface
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath:['p1', 'content'],
    startOffset: 3,
    endPath: ['p2', 'content'],
    endOffset: 2,
    reverse: true
  })
  surface.setSelection(sel)
  var wsel = BrowserDOMElement.getWindowSelection()
  t.ok(BrowserDOMElement.isReverse(wsel.anchorNode, wsel.anchorOffset, wsel.focusNode, wsel.focusOffset))
  t.end()
})
