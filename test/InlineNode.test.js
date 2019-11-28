import { test } from 'substance-test'
import { EditingInterface, documentHelpers } from 'substance'
import setupEditor from './shared/setupEditor'
import twoParagraphs from './fixture/twoParagraphs'

// NOTE: surface ids are a bit ids of Surfaces and IsolatedNodes are not very intuitive
// body/in1 means parent surface of in1 is body -- while in1 is actually on p1.content, which is not a surface on its own

test('InlineNode: InlineNodes should be not selected when selection is null', t => {
  const { editorSession, editor } = setupEditor(t, paragraphsWithInlineNodes)
  const comps = editor.findAll('.sc-inline-node')
  editorSession.setSelection(null)
  comps.forEach(comp => {
    t.ok(comp.isNotSelected(), "node '" + comp.getId() + "' should not be selected.")
  })
  t.end()
})

test('InlineNode: InlineNodes should be not selected when selection is somewhere else', t => {
  const { editorSession, editor } = setupEditor(t, paragraphsWithInlineNodes)
  const comps = editor.findAll('.sc-inline-node')
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 5,
    surfaceId: 'body'
  })
  comps.forEach(comp => {
    t.ok(comp.isNotSelected(), "node '" + comp.getId() + "' should not be selected.")
  })
  t.end()
})

test("InlineNode: InlineNode should be 'selected' with when the inline node is selected", t => {
  const { editorSession, editor } = setupEditor(t, paragraphsWithInlineNodes)
  const comps = editor.findAll('.sc-inline-node')
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 2,
    endOffset: 3,
    surfaceId: 'body'
  })
  var expected = {
    'body/in1': 'selected',
    'body/in2': undefined
  }
  comps.forEach(comp => {
    var id = comp.getId()
    t.equal(comp.getMode(), expected[id], "node '" + id + "' should be " + (expected[id] || 'not selected'))
  })
  t.end()
})

test("InlineNode: InlineNode should be 'co-selected' when selection is spanning an inline node", t => {
  const { editorSession, editor } = setupEditor(t, paragraphsWithInlineNodes)
  const comps = editor.findAll('.sc-inline-node')
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 1,
    endOffset: 4,
    surfaceId: 'body'
  })
  var expected = {
    'body/in1': 'co-selected',
    'body/in2': undefined
  }
  comps.forEach(comp => {
    var id = comp.getId()
    t.equal(comp.getMode(), expected[id], "node '" + id + "' should be " + (expected[id] || 'not selected'))
  })
  t.end()
})

test("InlineNode: InlineNode should be 'focused' when having the selection", t => {
  const { editorSession, editor } = setupEditor(t, paragraphsWithInlineNodes)
  const comps = editor.findAll('.sc-inline-node')
  editorSession.setSelection({
    type: 'property',
    path: ['in1', 'content'],
    startOffset: 1,
    endOffset: 2,
    surfaceId: 'body/in1/in1.content'
  })
  var expected = {
    'body/in1': 'focused',
    'body/in2': undefined
  }
  comps.forEach(comp => {
    var id = comp.getId()
    t.equal(comp.getMode(), expected[id], "node '" + id + "' should be " + (expected[id] || 'not selected'))
  })
  t.end()
})

test("InlineNode: InlineNode should be 'co-focused' when a nested inline node has the selection", t => {
  const { editorSession, editor } = setupEditor(t, nestedInlineNode)
  const comps = editor.findAll('.sc-inline-node')
  editorSession.setSelection({
    type: 'property',
    path: ['in2', 'content'],
    startOffset: 2,
    surfaceId: 'body/in1/in1.content/in2/in2.content'
  })
  var expected = {
    'body/in1': 'co-focused',
    'body/in1/in1.content/in2': 'focused'
  }
  comps.forEach(comp => {
    const id = comp.getId()
    t.equal(comp.getMode(), expected[id], "node '" + id + "' should be " + (expected[id] || 'not selected'))
  })
  t.end()
})

test('InlineNode: Click on InlineNode inside IsolatedNode should select InlineNode', t => {
  const { editor, editorSession } = setupEditor(t, inlineNodeInsideIsolatedNode)
  const comp = editor.find('*[data-id="in"]')
  comp.click()
  const sel = editorSession.getSelection()
  t.deepEqual({
    path: sel.path,
    startOffset: sel.start.offset,
    endOffset: sel.end.offset,
    surfaceId: sel.surfaceId
  }, {
    path: ['sn-body-p1', 'content'],
    startOffset: 3,
    endOffset: 4,
    surfaceId: 'body/sn/sn.body'
  }, 'inline node should be selected')
  t.ok(comp.el.hasClass('sm-selected'), 'inline node component should render selected')
  t.end()
})

// fixtures

function paragraphsWithInlineNodes (doc) {
  var tx = new EditingInterface(doc)
  twoParagraphs(tx)
  tx.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 2
  })
  tx.insertInlineNode({
    type: 'test-inline-node',
    id: 'in1',
    content: 'XXX'
  })
  tx.setSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 2
  })
  tx.insertInlineNode({
    type: 'test-inline-node',
    id: 'in2',
    content: 'YYY'
  })
}

// co-focusing an inline node is only possible, if the inline node itself contains
// content with an inline node (or isolated node)
function nestedInlineNode (doc) {
  const tx = new EditingInterface(doc)
  twoParagraphs(tx)
  tx.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 2
  })
  tx.insertInlineNode({
    type: 'test-inline-node',
    id: 'in1',
    content: 'XXXXXX'
  })
  tx.setSelection({
    type: 'property',
    path: ['in1', 'content'],
    startOffset: 3
  })
  tx.insertInlineNode({
    type: 'test-inline-node',
    id: 'in2',
    content: 'YYY'
  })
}

function inlineNodeInsideIsolatedNode (doc) {
  const tx = new EditingInterface(doc)
  const body = tx.get('body')
  documentHelpers.createNodeFromJson(tx, {
    type: 'structured-node',
    id: 'sn',
    title: 'Foo',
    body: [{
      type: 'paragraph',
      id: 'sn-body-p1',
      content: 'abcdefgh'
    }]
  })
  body.append('sn')
  tx.setSelection({
    type: 'property',
    path: ['sn-body-p1', 'content'],
    startOffset: 3,
    surfaceId: 'body/sn/sn.body/sn-body-p1.content'
  })
  tx.insertInlineNode({
    type: 'test-inline-node',
    id: 'in',
    content: 'XXX'
  })
}
