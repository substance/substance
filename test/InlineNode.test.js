import { test } from 'substance-test'
import { EditingInterface } from 'substance'
import setupEditor from './fixture/setupEditor'
import twoParagraphs from './fixture/twoParagraphs'

// NOTE: surface ids are a bit ids of Surfaces and IsolatedNodes are not very intuitive
// body/in1 means parent surface of in1 is body -- while in1 is actually on p1.content, which is not a surface on its own

test('InlineNode: InlineNodes should be not selected when selection is null', t => {
  let { editorSession, editor } = setupEditor(t, paragraphsWithInlineNodes)
  let nodes = editor.findAll('.sc-inline-node')
  editorSession.setSelection(null)
  nodes.forEach(function (node) {
    t.ok(node.isNotSelected(), "node '" + node.getId() + "' should not be selected.")
  })
  t.end()
})

test('InlineNode: InlineNodes should be not selected when selection is somewhere else', t => {
  let { editorSession, editor } = setupEditor(t, paragraphsWithInlineNodes)
  let nodes = editor.findAll('.sc-inline-node')
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 5,
    surfaceId: 'body'
  })
  nodes.forEach(function (node) {
    t.ok(node.isNotSelected(), "node '" + node.getId() + "' should not be selected.")
  })
  t.end()
})

test("InlineNode: InlineNode should be 'selected' with when the inline node is selected", t => {
  let { editorSession, editor } = setupEditor(t, paragraphsWithInlineNodes)
  let nodes = editor.findAll('.sc-inline-node')
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
  nodes.forEach(function (node) {
    var id = node.getId()
    t.equal(node.getMode(), expected[id], "node '" + id + "' should be " + (expected[id] || 'not selected'))
  })
  t.end()
})

test("InlineNode: InlineNode should be 'co-selected' when selection is spanning an inline node", t => {
  let { editorSession, editor } = setupEditor(t, paragraphsWithInlineNodes)
  let nodes = editor.findAll('.sc-inline-node')
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
  nodes.forEach(function (node) {
    var id = node.getId()
    t.equal(node.getMode(), expected[id], "node '" + id + "' should be " + (expected[id] || 'not selected'))
  })
  t.end()
})

test("InlineNode: InlineNode should be 'focused' when having the selection", t => {
  let { editorSession, editor } = setupEditor(t, paragraphsWithInlineNodes)
  let nodes = editor.findAll('.sc-inline-node')
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
  nodes.forEach(function (node) {
    var id = node.getId()
    t.equal(node.getMode(), expected[id], "node '" + id + "' should be " + (expected[id] || 'not selected'))
  })
  t.end()
})

test("InlineNode: InlineNode should be 'co-focused' when a nested inline node has the selection", t => {
  let { editorSession, editor } = setupEditor(t, nestedInlineNode)
  let nodes = editor.findAll('.sc-inline-node')
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
  nodes.forEach(node => {
    let id = node.getId()
    t.equal(node.getMode(), expected[id], "node '" + id + "' should be " + (expected[id] || 'not selected'))
  })
  t.end()
})

test('InlineNode: Click on InlineNode inside IsolatedNode should select InlineNode', t => {
  let { editor, editorSession } = setupEditor(t, inlineNodeInsideIsolatedNode)
  let comp = editor.find('*[data-id="in"]')
  comp.click()
  let sel = editorSession.getSelection()
  t.deepEqual({
    path: sel.path,
    startOffset: sel.startOffset,
    endOffset: sel.endOffset,
    surfaceId: sel.surfaceId
  }, {
    path: ['sn', 'body'],
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
  let tx = new EditingInterface(doc)
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
  let tx = new EditingInterface(doc)
  let body = tx.get('body')
  body.append(tx.create({
    type: 'structured-node',
    id: 'sn',
    title: 'Foo',
    body: 'abcdefgh'
  }))
  tx.setSelection({
    type: 'property',
    path: ['sn', 'body'],
    startOffset: 3,
    surfaceId: 'body/sn/sn.body'
  })
  tx.insertInlineNode({
    type: 'test-inline-node',
    id: 'in',
    content: 'XXX'
  })
}
