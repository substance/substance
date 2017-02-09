import { module } from 'substance-test'
import setDOMSelection from '../util/setDOMSelection'
import EditingInterface from '../model/EditingInterface'
import setupEditor from './fixture/setupEditor'
import checkValues from './fixture/checkValues'
import { _p1, _empty, _t1 } from './fixture/samples'

const test = module('DOMSelection')

test.UI("Mapping a cursor inside a TextProperty from DOM to model", function(t) {
  let { editor, surface } = setupEditor(t, _p1)
  let domSelection = surface.context.domSelection
  let node = editor.el.find('[data-path="p1.content"]').getFirstChild()
  setDOMSelection(node, 3)
  let sel = domSelection.getSelection()
  t.notOk(!sel || sel.isNull(), 'Selection should not be null')
  checkValues(t, sel.toJSON(), {
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3,
    containerId: 'body',
    surfaceId: 'body'
  })
  t.end()
})

test.UI("Mapping a cursor in an empty paragraph from DOM to model", function(t) {
  let { editor, surface } = setupEditor(t, _empty)
  let domSelection = surface.context.domSelection
  let node = editor.el.find('[data-path="empty.content"]').getFirstChild()
  setDOMSelection(node, 0)
  let sel = domSelection.getSelection()
  t.notOk(!sel || sel.isNull(), 'Selection should not be null')
  checkValues(t, sel.toJSON(), {
    type: 'property',
    path: ['empty', 'content'],
    startOffset: 0,
    containerId: 'body',
    surfaceId: 'body'
  })
  t.end()
})

test.UI("Mapping a ContainerSelection from DOM to model", function(t) {
  let { editor, surface } = setupEditor(t, surfaceWithParagraphs)
  let domSelection = surface.context.domSelection
  let p1Text = editor.el.find('[data-path="p1.content"]').getFirstChild()
  let p2Text = editor.el.find('[data-path="p2.content"]').getFirstChild()
  setDOMSelection(p1Text, 1, p2Text, 2)
  let sel = domSelection.getSelection()
  t.notOk(!sel || sel.isNull(), 'Selection should not be null')
  checkValues(t, sel.toJSON(), {
    type: 'container',
    startPath: ['p1', 'content'],
    startOffset: 1,
    endPath: ['p2', 'content'],
    endOffset: 2,
    containerId: 'body',
    surfaceId: 'body'
  })
  t.end()
})

test.FF("Issue #354: Wrong selection in FF when double clicking between lines", function(t) {
  let { editor, surface } = setupEditor(t, surfaceWithParagraphs)
  let domSelection = surface.context.domSelection
  let surfaceEl = editor.el.find('[data-id="body"]')
  setDOMSelection(surfaceEl, 0, surfaceEl, 1)
  let sel = domSelection.getSelection()
  t.notOk(!sel || sel.isNull(), 'Selection should not be null')
  checkValues(t, sel.toJSON(), {
    type: 'node',
    nodeId: 'p1',
    mode: 'full',
    containerId: 'body',
    surfaceId: 'body'
  })
  t.end()
})

// happens when using the same selection as in #354 in Chrome
test.UI("DOM selection that starts in a TextNode and ends in a paragraph on element level", function(t) {
  let { editor, surface } = setupEditor(t, surfaceWithParagraphs)
  let domSelection = surface.context.domSelection
  let p1Text = editor.el.find('[data-path="p1.content"]').getFirstChild()
  let p2El = editor.el.find('[data-id="p2"]')
  setDOMSelection(p1Text, 0, p2El, 0)
  let sel = domSelection.getSelection()
  t.notOk(!sel || sel.isNull(), 'Selection should not be null')
  checkValues(t, sel.toJSON(), {
    type: 'container',
    startPath: ['p1', 'content'],
    startOffset: 0,
    endPath: ['p2', 'content'],
    endOffset: 0,
    containerId: 'body',
    surfaceId: 'body'
  })
  t.end()
})

test.UI("Issue #376: Wrong selection mapping at end of paragraph", function(t) {
  let { editor, surface } = setupEditor(t, surfaceWithParagraphs)
  let domSelection = surface.context.domSelection
  let p1span = editor.el.find('[data-id="p1"] span')
  let p2El = editor.el.find('[data-id="p2"]')
  setDOMSelection(p1span, 1, p2El, 0)
  let sel = domSelection.getSelection()
  t.notOk(!sel || sel.isNull(), 'Selection should not be null')
  checkValues(t, sel.toJSON(), {
    type: 'container',
    startPath: ['p1', 'content'],
    startOffset: 2,
    endPath: ['p2', 'content'],
    endOffset: 0,
    containerId: 'body',
    surfaceId: 'body'
  })
  t.end()
})

test.UI("Rendering a ContainerSelection", function(t) {
  let { editor, doc, surface } = setupEditor(t, surfaceWithParagraphs)
  let domSelection = surface.context.domSelection
  let sel = doc.createSelection({
    type: 'container',
    startPath: ['p1', 'content'],
    startOffset: 1,
    endPath: ['p2', 'content'],
    endOffset: 1,
    containerId: 'body',
    surfaceId: 'body'
  })
  domSelection.setSelection(sel)

  let p1Text = editor.el.find('[data-path="p1.content"]').getFirstChild()
  let p2Text = editor.el.find('[data-path="p2.content"]').getFirstChild()

  let wSel = window.getSelection()
  t.equal(wSel.anchorNode, p1Text.getNativeElement(), 'anchorNode should be in first paragraph.')
  t.equal(wSel.anchorOffset, 1, 'anchorOffset should be correct.')
  t.equal(wSel.focusNode, p2Text.getNativeElement(), 'focusNode should be in second paragraph.')
  t.equal(wSel.focusOffset, 1, 'focusOffset should be correct.')
  t.end()
})

test.UI("Rendering a cursor after inline node", function(t) {
  let { editor, doc, surface } = setupEditor(t, paragraphWithInlineNodes)
  let domSelection = surface.context.domSelection
  let sel = doc.createSelection({
    type: 'property',
    path: ['p', 'content'],
    startOffset: 3,
    containerId: 'body',
    surfaceId: 'body'
  })
  let {start, end} = domSelection.mapModelToDOMCoordinates(sel)
  let pSpan = editor.el.find('[data-path="p.content"]')
  let third = pSpan.getChildAt(2)
  t.ok(start.container === third.getNativeElement(), 'anchorNode should be correct.')
  t.equal(start.offset, 0, 'anchorOffset should be correct.')
  t.ok(end.container === start.container, 'focusNode should be correct.')
  t.equal(end.offset, 0, 'focusOffset should be correct.')
  t.end()
})

test.UI("Rendering a cursor after inline node at the end of a property", function(t) {
  let { editor, doc, surface } = setupEditor(t, paragraphWithInlineNodes)
  let domSelection = surface.context.domSelection
  let sel = doc.createSelection({
    type: 'property',
    path: ['p', 'content'],
    startOffset: 13,
    containerId: 'body',
    surfaceId: 'body'
  })
  let {start, end} = domSelection.mapModelToDOMCoordinates(sel)
  let pSpan = editor.el.find('[data-path="p.content"]')
  t.ok(start.container === pSpan.getNativeElement(), 'anchorNode should be correct.')
  t.equal(start.offset, 6, 'anchorOffset should be correct.')
  t.ok(end.container === start.container, 'focusNode should be correct.')
  t.equal(end.offset, 6, 'focusOffset should be correct.')
  t.end()
})

// test.UI("Rendering a cursor before isolated node", function(t) {
//   let { doc, surface } = setupEditor(t, _t1)
//   let domSelection = surface.context.domSelection
//   let sel = doc.createSelection({
//     type: 'node',
//     nodeId: 't1',
//     mode: 'before',
//     containerId: 'body',
//     surfaceId: 'body'
//   })
//   domSelection.setSelection(sel)
//   // let {start, end} = domSelection.mapModelToDOMCoordinates(sel)
//   // let pSpan = editor.el.find('[data-path="p.content"]')
//   // t.ok(start.container === pSpan.getNativeElement(), 'anchorNode should be correct.')
//   // t.equal(start.offset, 6, 'anchorOffset should be correct.')
//   // t.ok(end.container === start.container, 'focusNode should be correct.')
//   // t.equal(end.offset, 6, 'focusOffset should be correct.')
//   t.end()
// })

// test.UI("Rendering a cursor after isolated node", function(t) {
//   let { doc, surface } = setupEditor(t, _t1)
//   let domSelection = surface.context.domSelection
//   let sel = doc.createSelection({
//     type: 'node',
//     nodeId: 't1',
//     mode: 'after',
//     containerId: 'body',
//     surfaceId: 'body'
//   })
//   domSelection.setSelection(sel)
//   // let {start, end} = domSelection.mapModelToDOMCoordinates(sel)
//   // let pSpan = editor.el.find('[data-path="p.content"]')
//   // t.ok(start.container === pSpan.getNativeElement(), 'anchorNode should be correct.')
//   // t.equal(start.offset, 6, 'anchorOffset should be correct.')
//   // t.ok(end.container === start.container, 'focusNode should be correct.')
//   // t.equal(end.offset, 6, 'focusOffset should be correct.')
//   t.end()
// })

function surfaceWithParagraphs(doc, body) {
  let tx = new EditingInterface(doc)
  body.show(tx.create({
    type: 'paragraph',
    id: 'p1',
    content: 'AA'
  }))
  body.show(tx.create({
    type: 'paragraph',
    id: 'p2',
    content: 'BBB'
  }))
  body.show(tx.create({
    type: 'paragraph',
    id: 'p3',
    content: 'CCCC'
  }))
}

function paragraphWithInlineNodes(doc, body) {
  let tx = new EditingInterface(doc)
  body.show(tx.create({
    type: 'paragraph',
    id: 'p',
    content: '0123456789'
  }))
  // -> 01X234X56789X
  tx.setSelection({type: 'property', path: ['p', 'content'], startOffset: 2})
  tx.insertInlineNode({ type: 'test-inline-node', id: 'in1', content: '[1]'})
  tx.setSelection({type: 'property', path: ['p', 'content'], startOffset: 6})
  tx.insertInlineNode({ type: 'test-inline-node', id: 'in2', content: '[2]'})
  tx.setSelection({type: 'property', path: ['p', 'content'], startOffset: 12})
  tx.insertInlineNode({ type: 'test-inline-node', id: 'in3', content: '[3]'})
}
