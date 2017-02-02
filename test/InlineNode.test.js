import { module } from 'substance-test'
import EditingInterface from '../model/EditingInterface'
import setupEditor from './fixture/setupEditor'
import twoParagraphs from './fixture/twoParagraphs'

const test = module('InlineNode')

test.UI("InlineNodes should be not selected when selection is null", function(t) {
  let { editorSession, editor } = setupEditor(t, paragraphsWithInlineNodes)
  let nodes = editor.findAll('.sc-inline-node')
  editorSession.setSelection(null)
  nodes.forEach(function(node){
    t.ok(node.isNotSelected(), "node '"+node.getId()+"' should not be selected.")
  })
  t.end()
})

test.UI("InlineNodes should be not selected when selection is somewhere else", function(t) {
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

test.UI("InlineNode should be 'selected' with when the inline node is selected", function(t) {
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

test.UI("InlineNode should be 'co-selected' when selection is spanning an inline node", function(t) {
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

test.UI("InlineNode should be 'focused' when having the selection", function(t) {
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
  // used this to play with the sandbox after the test was run, e.g. to find out
  // the real surface ids
  // editorSession.on('didUpdate', function(change) {
  //   if (change.selection) {
  //     console.log(change.selection)
  //   }
  // })
  t.end()
})

// Similar to the previous but with another inline node being focused
test.UI("InlineNode should be 'focused' when having the selection (II)", function(t) {
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

// FIXME: broken since introduction of EditorSession/Flow
// test.UI("InlineNode should be 'co-focused' when a nested inline node has the selection", function(t) {
//   let { editorSession, editor } = setupEditor(t, nestedInlineNode, t.sandbox)
//   let nodes = editor.findAll('.sc-inline-node')
//   editorSession.setSelection({
//     type: 'property',
//     path: ['sn2', 'title'],
//     startOffset: 2,
//     surfaceId: 'body/in1/sn1.title/in2'
//   })
//   var expected = {
//     'body/in1': 'co-focused',
//     'body/in1/sn1.title/in2': 'focused',
//   }
//   nodes.forEach(function(node){
//     var id = node.getId()
//     t.equal(node.getMode(), expected[id], "node '" + id + "' should be " + (expected[id] || 'not selected') )
//   })
//   t.end()
// })

// fixtures

function paragraphsWithInlineNodes(doc) {
  var tx = new EditingInterface(doc)
  twoParagraphs(tx)
  var sn1 = tx.create({
    type: "structured-node",
    id: "sn",
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
// function nestedInlineNode(doc) {
//   let tx = new EditingInterface(doc)
//   twoParagraphs(tx)
//   let sn1 = tx.create({
//     type: "structured-node",
//     id: "sn1",
//     title: "ABCDEFG"
//   })
//   tx.setSelection({
//     type: 'property',
//     path: ['p1', 'content'],
//     startOffset: 2
//   })
//   tx.insertInlineNode({
//     type: 'inline-wrapper',
//     id: 'in1',
//     wrappedNode: sn1.id
//   })
//   let sn2 = doc.create({
//     type: "structured-node",
//     id: "sn2",
//     title: "ABCDEFG"
//   })
//   tx.setSelection({
//     type: 'paragraph',
//     path: ['sn1', 'content'],
//     startOffset: 4
//   })
//   tx.insertInlineNode({
//     type: 'inline-wrapper',
//     id: 'in2',
//     wrappedNode: sn2.id
//   })
// }
