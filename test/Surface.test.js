/* eslint-disable no-invalid-this */
import { test } from 'substance-test'
import { platform, BrowserDOMElement, parseKeyCombo } from 'substance'
import setupEditor from './shared/setupEditor'
import { createSurfaceEvent } from './shared/testHelpers'

function uiTest (title, fn) {
  if (platform.inBrowser) {
    test(title, fn)
  }
}

const P1_TEXT = 'abcdef'

function _p1 (doc, body) {
  doc.create({
    type: 'paragraph',
    id: 'p1',
    content: P1_TEXT
  })
  body.append('p1')
}

const P2_TEXT = 'ghijk'

function _p2 (doc, body) {
  doc.create({
    type: 'paragraph',
    id: 'p2',
    content: P2_TEXT
  })
  body.append('p2')
}

// This test was added to cover issue #82
uiTest('Surface: Set the selection after creating annotation.', t => {
  window.getSelection().removeAllRanges()
  const { editorSession, surface } = setupEditor(t, _p1)
  const sel = editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 0,
    endOffset: 5,
    containerPath: ['body', 'nodes'],
    surfaceId: 'body'
  })
  editorSession.transaction(function (tx) {
    tx.annotate({ type: 'strong' })
  })
  const wsel = window.getSelection()
  const newSel = surface.domSelection.getSelection()
  t.equal(wsel.rangeCount, 1, 'There should be a DOM selection.')
  t.ok(newSel.equals(sel), 'New selection should be equal to initial selection.')
  t.end()
})

uiTest('Surface: Render a reverse selection.', t => {
  window.getSelection().removeAllRanges()
  const { editorSession } = setupEditor(t, _p1, _p2)
  editorSession.setSelection({
    type: 'container',
    startPath: ['p1', 'content'],
    startOffset: 3,
    endPath: ['p2', 'content'],
    endOffset: 2,
    reverse: true,
    containerPath: ['body', 'nodes'],
    surfaceId: 'body'
  })
  var wsel = BrowserDOMElement.getWindowSelection()
  t.ok(BrowserDOMElement.isReverse(wsel.anchorNode, wsel.anchorOffset, wsel.focusNode, wsel.focusOffset))
  t.end()
})

test('Surface: type()', t => {
  const { editorSession, doc, surface } = setupEditor(t, _p1, _p2)
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 0,
    endOffset: 0,
    surfaceId: surface.id
  })
  surface.type('x')
  t.equal(doc.get(['p1', 'content']), 'x' + P1_TEXT, 'text should have been updated')
  t.end()
})

test('Surface: input events', t => {
  const { editorSession, doc, surface } = setupEditor(t, _p1, _p2)
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 0,
    endOffset: 0,
    surfaceId: surface.id
  })
  surface.onTextInput(createSurfaceEvent(surface, { data: 'x' }))
  t.equal(doc.get(['p1', 'content']), 'x' + P1_TEXT, 'text should have been updated')
  t.end()
})

test('Surface: input events (shim)', t => {
  const { editorSession, doc, surface } = setupEditor(t, _p1, _p2)
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 0,
    endOffset: 0,
    surfaceId: surface.id
  })
  surface.onTextInputShim(createSurfaceEvent(surface, { which: 'x'.charCodeAt(0) }))
  t.equal(doc.get(['p1', 'content']), 'x' + P1_TEXT, 'text should have been updated')
  t.end()
})

test('Surface: space', t => {
  const { editorSession, doc, surface } = setupEditor(t, _p1, _p2)
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 0,
    endOffset: 0,
    surfaceId: surface.id
  })
  surface.onKeyDown(createSurfaceEvent(surface, parseKeyCombo('Space')))
  t.equal(doc.get(['p1', 'content']), ' ' + P1_TEXT, 'text should have been updated')
  t.end()
})
