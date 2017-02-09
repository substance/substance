import { module } from 'substance-test'
import EditingInterface from '../model/EditingInterface'
import setupEditor from './fixture/setupEditor'
import twoParagraphs from './fixture/twoParagraphs'

const test = module('InlineNode')

// NOTE: surface ids are a bit ids of Surfaces and IsolatedNodes are not very intuitive
// body/in1 means parent surface of in1 is body -- while in1 is actually on p1.content, which is not a surface on its own

test("InlineNodes should be not selected when selection is null", function(t) {
  let { editorSession, editor } = setupEditor(t, paragraphsWithInlineNodes)
  let nodes = editor.findAll('.sc-inline-node')
  editorSession.setSelection(null)
  nodes.forEach(function(node){
    t.ok(node.isNotSelected(), "node '"+node.getId()+"' should not be selected.")
  })
  t.end()
})

test("InlineNodes should be not selected when selection is somewhere else", function(t) {
  let { editorSession, editor } = setupEditor(t, paragraphsWithInlineNodes)
  let nodes = editor.findAll('.sc-inline-node')
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 5,
    surfaceId: 'body'
  })
  nodes.forEach(function(node){
    t.ok(node.isNotSelected(), "node '"+node.getId()+"' should not be selected.")
  })
  t.end()
})

test("InlineNode should be 'selected' with when the inline node is selected", function(t) {
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
    'body/in2': undefined,
  }
  nodes.forEach(function(node){
    var id = node.getId()
    t.equal(node.getMode(), expected[id], "node '" + id + "' should be " + (expected[id] || 'not selected') )
  })
  t.end()
})

test("InlineNode should be 'co-selected' when selection is spanning an inline node", function(t) {
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
    'body/in2': undefined,
  }
  nodes.forEach(function(node){
    var id = node.getId()
    t.equal(node.getMode(), expected[id], "node '" + id + "' should be " + (expected[id] || 'not selected') )
  })
  t.end()
})

test("InlineNode should be 'focused' when having the selection", function(t) {
  let { editorSession, editor } = setupEditor(t, paragraphsWithInlineNodes)
  let nodes = editor.findAll('.sc-inline-node')
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 1,
    endOffset: 4,
    surfaceId: 'body/in1/sn1.title'
  })
  var expected = {
    'body/in1': 'focused',
    'body/in2': undefined,
  }
  nodes.forEach(function(node){
    var id = node.getId()
    t.equal(node.getMode(), expected[id], "node '" + id + "' should be " + (expected[id] || 'not selected') )
  })
  t.end()
})

// Similar to the previous but with another inline node being focused
test("InlineNode should be 'focused' when having the selection (II)", function(t) {
  let { editorSession, editor } = setupEditor(t, paragraphsWithInlineNodes)
  let nodes = editor.findAll('.sc-inline-node')
  editorSession.setSelection({
    type: 'property',
    path: ['c_p', 'content'],
    startOffset: 1,
    endOffset: 4,
    surfaceId: 'body/in2/c'
  })
  var expected = {
    'body/in1': undefined,
    'body/in2': 'focused',
  }
  nodes.forEach(function(node){
    var id = node.getId()
    t.equal(node.getMode(), expected[id], "node '" + id + "' should be " + (expected[id] || 'not selected') )
  })
  t.end()
})

test("InlineNode should be 'co-focused' when a nested inline node has the selection", function(t) {
  let { editorSession, editor } = setupEditor(t, nestedInlineNode)
  let nodes = editor.findAll('.sc-inline-node')
  editorSession.setSelection({
    type: 'property',
    path: ['sn2', 'title'],
    startOffset: 2,
    surfaceId: 'body/in1/sn1.title/in2/sn2.title'
  })
  var expected = {
    'body/in1': 'co-focused',
    'body/in1/sn1.title/in2': 'focused',
  }
  nodes.forEach(function(node){
    var id = node.getId()
    t.equal(node.getMode(), expected[id], "node '" + id + "' should be " + (expected[id] || 'not selected') )
  })
  t.end()
})

// fixtures

function paragraphsWithInlineNodes(doc) {
  var tx = new EditingInterface(doc)
  twoParagraphs(tx)
  var sn1 = tx.create({
    type: "structured-node",
    id: "sn1",
    title: "ABCDEFG"
  })
  tx.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 2
  })
  tx.insertInlineNode({
    type: 'inline-wrapper',
    id: 'in1',
    wrappedNode: sn1.id
  })
  var c = tx.create({
    type: "container",
    id: "c"
  })
  var c_p = tx.create({
    type: 'paragraph',
    id: "c_p",
    content: "ABCDEFG"
  })
  c.show(c_p)
  tx.setSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 2
  })
  tx.insertInlineNode({
    type: 'inline-wrapper',
    id: 'in2',
    wrappedNode: c.id
  })
}

// co-focusing an inline node is only possible, if the inline node itself contains
// content with an inline node (or isolated node)
function nestedInlineNode(doc) {
  let tx = new EditingInterface(doc)
  twoParagraphs(tx)
  let sn1 = tx.create({
    type: "structured-node",
    id: "sn1",
    title: "ABCDEFG"
  })
  tx.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 2
  })
  tx.insertInlineNode({
    type: 'inline-wrapper',
    id: 'in1',
    wrappedNode: sn1.id
  })
  let sn2 = doc.create({
    type: "structured-node",
    id: "sn2",
    title: "ABCDEFG"
  })
  tx.setSelection({
    type: 'property',
    path: ['sn1', 'title'],
    startOffset: 4
  })
  tx.insertInlineNode({
    type: 'inline-wrapper',
    id: 'in2',
    wrappedNode: sn2.id
  })
}
