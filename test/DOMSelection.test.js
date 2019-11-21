import { test } from 'substance-test'
import { platform, setDOMSelection, EditingInterface } from 'substance'
import setupEditor from './shared/setupEditor'
import checkValues from './shared/checkValues'
import { _p1, _empty } from './fixture/samples'

function uiTest (title, fn) {
  if (platform.inBrowser) {
    test(title, fn)
  }
}

function ffTest (title, fn) {
  if (platform.isFF) {
    test(title, fn)
  }
}

uiTest('DOMSelection: Mapping a cursor inside a TextProperty from DOM to model', function (t) {
  const { editor, surface } = setupEditor(t, _p1)
  const domSelection = _getDOMSelectionFromSurface(surface)
  const node = editor.el.find('[data-path="p1.content"]').getFirstChild()
  setDOMSelection(node, 3)
  const sel = domSelection.getSelection()
  t.notOk(!sel || sel.isNull(), 'Selection should not be null')
  checkValues(t, sel.toJSON(), {
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3,
    containerPath: ['body', 'nodes'],
    surfaceId: 'body'
  })
  t.end()
})

uiTest('DOMSelection: Mapping a cursor in an empty paragraph from DOM to model', function (t) {
  const { editor, surface } = setupEditor(t, _empty)
  const domSelection = _getDOMSelectionFromSurface(surface)
  const node = editor.el.find('[data-path="empty.content"]').getFirstChild()
  setDOMSelection(node, 0)
  const sel = domSelection.getSelection()
  t.notOk(!sel || sel.isNull(), 'Selection should not be null')
  checkValues(t, sel.toJSON(), {
    type: 'property',
    path: ['empty', 'content'],
    startOffset: 0,
    containerPath: ['body', 'nodes'],
    surfaceId: 'body'
  })
  t.end()
})

uiTest('DOMSelection: Mapping a ContainerSelection from DOM to model', function (t) {
  const { editor, surface } = setupEditor(t, _surfaceWithParagraphs)
  const domSelection = _getDOMSelectionFromSurface(surface)
  const p1Text = editor.el.find('[data-path="p1.content"]').getFirstChild()
  const p2Text = editor.el.find('[data-path="p2.content"]').getFirstChild()
  setDOMSelection(p1Text, 1, p2Text, 2)
  const sel = domSelection.getSelection()
  t.notOk(!sel || sel.isNull(), 'Selection should not be null')
  checkValues(t, sel.toJSON(), {
    type: 'container',
    startPath: ['p1', 'content'],
    startOffset: 1,
    endPath: ['p2', 'content'],
    endOffset: 2,
    containerPath: ['body', 'nodes'],
    surfaceId: 'body'
  })
  t.end()
})

ffTest('DOMSelection: Issue #354: Wrong selection in FF when double clicking between lines', function (t) {
  const { editor, surface } = setupEditor(t, _surfaceWithParagraphs)
  const domSelection = _getDOMSelectionFromSurface(surface)
  const surfaceEl = editor.el.find('[data-id="body"]')
  setDOMSelection(surfaceEl, 0, surfaceEl, 1)
  const sel = domSelection.getSelection()
  t.notOk(!sel || sel.isNull(), 'Selection should not be null')
  checkValues(t, sel.toJSON(), {
    type: 'node',
    nodeId: 'p1',
    mode: 'full',
    containerPath: ['body', 'nodes'],
    surfaceId: 'body'
  })
  t.end()
})

// happens when using the same selection as in #354 in Chrome
uiTest('DOMSelection: DOM selection that starts in a TextNode and ends in a paragraph on element level', function (t) {
  const { editor, surface } = setupEditor(t, _surfaceWithParagraphs)
  const domSelection = _getDOMSelectionFromSurface(surface)
  const p1Text = editor.el.find('[data-path="p1.content"]').getFirstChild()
  const p2El = editor.el.find('[data-id="p2"]')
  setDOMSelection(p1Text, 0, p2El, 0)
  const sel = domSelection.getSelection()
  t.notOk(!sel || sel.isNull(), 'Selection should not be null')
  checkValues(t, sel.toJSON(), {
    type: 'container',
    startPath: ['p1', 'content'],
    startOffset: 0,
    endPath: ['p2', 'content'],
    endOffset: 0,
    containerPath: ['body', 'nodes'],
    surfaceId: 'body'
  })
  t.end()
})

uiTest('DOMSelection: Issue #376: Wrong selection mapping at end of paragraph', function (t) {
  const { editor, surface } = setupEditor(t, _surfaceWithParagraphs)
  const domSelection = _getDOMSelectionFromSurface(surface)
  const p1span = editor.el.find('[data-id="p1"] span')
  const p2El = editor.el.find('[data-id="p2"]')
  setDOMSelection(p1span, 1, p2El, 0)
  const sel = domSelection.getSelection()
  t.notOk(!sel || sel.isNull(), 'Selection should not be null')
  checkValues(t, sel.toJSON(), {
    type: 'container',
    startPath: ['p1', 'content'],
    startOffset: 2,
    endPath: ['p2', 'content'],
    endOffset: 0,
    containerPath: ['body', 'nodes'],
    surfaceId: 'body'
  })
  t.end()
})

uiTest('DOMSelection: Rendering a ContainerSelection', function (t) {
  const { editor, doc, surface } = setupEditor(t, _surfaceWithParagraphs)
  const domSelection = _getDOMSelectionFromSurface(surface)
  const sel = doc.createSelection({
    type: 'container',
    startPath: ['p1', 'content'],
    startOffset: 1,
    endPath: ['p2', 'content'],
    endOffset: 1,
    containerPath: ['body', 'nodes'],
    surfaceId: 'body'
  })
  domSelection.setSelection(sel)

  const p1Text = editor.el.find('[data-path="p1.content"]').getFirstChild()
  const p2Text = editor.el.find('[data-path="p2.content"]').getFirstChild()

  const wSel = window.getSelection()
  t.equal(wSel.anchorNode, p1Text.getNativeElement(), 'anchorNode should be in first paragraph.')
  t.equal(wSel.anchorOffset, 1, 'anchorOffset should be correct.')
  t.equal(wSel.focusNode, p2Text.getNativeElement(), 'focusNode should be in second paragraph.')
  t.equal(wSel.focusOffset, 1, 'focusOffset should be correct.')
  t.end()
})

uiTest('DOMSelection: Rendering a cursor after inline node', function (t) {
  const { editor, doc, surface } = setupEditor(t, _paragraphWithInlineNodes)
  const domSelection = _getDOMSelectionFromSurface(surface)
  const sel = doc.createSelection({
    type: 'property',
    path: ['p', 'content'],
    startOffset: 3,
    containerPath: ['body', 'nodes'],
    surfaceId: 'body'
  })
  const { start, end } = domSelection.mapModelToDOMCoordinates(sel)
  const pSpan = editor.el.find('[data-path="p.content"]')
  const third = pSpan.getChildAt(2)
  t.ok(start.container === third.getNativeElement(), 'anchorNode should be correct.')
  t.equal(start.offset, 0, 'anchorOffset should be correct.')
  t.ok(end.container === start.container, 'focusNode should be correct.')
  t.equal(end.offset, 0, 'focusOffset should be correct.')
  t.end()
})

uiTest('DOMSelection: Rendering a cursor after inline node at the end of a property', function (t) {
  const { editor, doc, surface } = setupEditor(t, _paragraphWithInlineNodes)
  const domSelection = _getDOMSelectionFromSurface(surface)
  const sel = doc.createSelection({
    type: 'property',
    path: ['p', 'content'],
    startOffset: 13,
    containerPath: ['body', 'nodes'],
    surfaceId: 'body'
  })
  const { start, end } = domSelection.mapModelToDOMCoordinates(sel)
  const pSpan = editor.el.find('[data-path="p.content"]')
  t.ok(start.container === pSpan.getNativeElement(), 'anchorNode should be correct.')
  t.equal(start.offset, 6, 'anchorOffset should be correct.')
  t.ok(end.container === start.container, 'focusNode should be correct.')
  t.equal(end.offset, 6, 'focusOffset should be correct.')
  t.end()
})

function _getDOMSelectionFromSurface (surface) {
  return surface.domSelection || surface.context.domSelection
}

function _surfaceWithParagraphs (doc, body) {
  const tx = new EditingInterface(doc)
  body.append(tx.create({
    type: 'paragraph',
    id: 'p1',
    content: 'AA'
  }))
  body.append(tx.create({
    type: 'paragraph',
    id: 'p2',
    content: 'BBB'
  }))
  body.append(tx.create({
    type: 'paragraph',
    id: 'p3',
    content: 'CCCC'
  }))
}

function _paragraphWithInlineNodes (doc, body) {
  const tx = new EditingInterface(doc)
  body.append(tx.create({
    type: 'paragraph',
    id: 'p',
    content: '0123456789'
  }))
  // -> 01X234X56789X
  tx.setSelection({ type: 'property', path: ['p', 'content'], startOffset: 2 })
  tx.insertInlineNode({ type: 'test-inline-node', id: 'in1', content: '[1]' })
  tx.setSelection({ type: 'property', path: ['p', 'content'], startOffset: 6 })
  tx.insertInlineNode({ type: 'test-inline-node', id: 'in2', content: '[2]' })
  tx.setSelection({ type: 'property', path: ['p', 'content'], startOffset: 12 })
  tx.insertInlineNode({ type: 'test-inline-node', id: 'in3', content: '[3]' })
}
