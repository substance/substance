/* eslint-disable no-invalid-this */
import { module } from 'substance-test'
import BrowserDOMElement from '../dom/BrowserDOMElement'
import setupEditor from './fixture/setupEditor'

const test = module('Surface')

// This test was added to cover issue #82
test.UI("Set the selection after creating annotation.", function(t) {
  window.getSelection().removeAllRanges()
  let { editorSession, surface } = setupEditor(t, _p1)
  let sel = editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 0,
    endOffset: 5,
    containerId: 'body',
    surfaceId: 'body'
  })
  editorSession.transaction(function(tx) {
    tx.annotate({ type: "strong" })
  })
  let wsel = window.getSelection()
  let newSel = surface.domSelection.getSelection()
  t.equal(wsel.rangeCount, 1, "There should be a DOM selection.")
  t.ok(newSel.equals(sel), "New selection should be equal to initial selection.")
  t.end()
})

test.UI("Render a reverse selection.", function(t) {
  window.getSelection().removeAllRanges()
  let { editorSession } = setupEditor(t, _p1, _p2)
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

const P1_TEXT = 'abcdef'

function _p1(doc, body) {
  doc.create({
    type: 'paragraph',
    id: 'p1',
    content: P1_TEXT
  })
  body.show('p1')
}

const P2_TEXT = 'ghijk'

function _p2(doc, body) {
  doc.create({
    type: 'paragraph',
    id: 'p2',
    content: P2_TEXT
  })
  body.show('p2')
}
