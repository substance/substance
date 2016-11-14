import { module } from 'substance-test'
import copySelection from '../../model/transform/copySelection'
import Document from '../../model/Document'
import fixture from '../fixtures/createTestArticle'
import simple from '../fixtures/simple'
import headersAndParagraphs from '../fixtures/headersAndParagraphs'

const test = module('transform/copySelection')

test("Copying a property selection", function(t) {
  var doc = fixture(headersAndParagraphs)
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 4,
    endOffset: 9
  })
  var args = {selection: sel}
  var out = copySelection(doc, args)
  var copy = out.doc
  var textNode = copy.get(Document.TEXT_SNIPPET_ID)
  t.notNil(textNode, 'There should be a text node for the property fragment.')
  t.equal(textNode.content, 'graph', 'Selected text should be copied.')
  t.end()
})

test("Copying a property selection with annotated text", function(t) {
  var doc = fixture(headersAndParagraphs)
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 10,
    endOffset: 19
  })
  var args = {selection: sel}
  var out = copySelection(doc, args)
  var copy = out.doc
  t.equal(copy.get([Document.TEXT_SNIPPET_ID, 'content']), 'with anno', 'Selected text should be copied.')
  var annos = copy.getIndex('annotations').get([Document.TEXT_SNIPPET_ID, 'content'])
  t.equal(annos.length, 1, 'There should be one annotation on copied text.')
  var anno = annos[0]
  t.equal(anno.type, "emphasis", "The annotation should be 'emphasis'.")
  t.deepEqual([anno.startOffset, anno.endOffset], [5, 9], 'The annotation should be over the text "anno".')
  t.end()
})

test("Copying a container selection", function(t) {
  var doc = fixture(headersAndParagraphs)
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['h1', 'content'],
    startOffset: 4,
    endPath: ['p2', 'content'],
    endOffset: 9
  })
  var args = {selection: sel}
  var out = copySelection(doc, args)
  var copy = out.doc
  var content = copy.get(Document.SNIPPET_ID)
  t.notNil(content, 'There should be a container node with id "content".')
  // 4 nodes? 'body', 'snippets', 'p1', 'p2'
  t.equal(content.nodes.length, 4, 'There should be 4 nodes in the copied document.')
  var first = copy.get(content.nodes[0])
  t.equal(first.type, 'heading', "The first node should be a heading.")
  t.equal(first.content, 'ion 1', "Its content should be truncated to 'ion 1'.")
  var last = copy.get(content.nodes[3])
  t.equal(last.type, 'paragraph', "The last node should be a paragraph.")
  t.equal(last.content, 'Paragraph', "Its content should be truncated to 'Paragraph'.")
  t.end()
})

// FIXME: broken since introduction of file nodes
// test("Copying a node without editable properties", function(t) {
//   var doc = fixture(simple)
//   doc.create({
//     type: 'image',
//     id: 'i1',
//     src: 'foo'
//   })
//   doc.get('body').show('i1', 1)
//   var sel = doc.createSelection({
//     type: 'container',
//     containerId: 'body',
//     startPath: ['p1', 'content'],
//     startOffset: 4,
//     endPath: ['p2', 'content'],
//     endOffset: 9
//   })
//   var args = {selection: sel}
//   var out = copySelection(doc, args)
//   var copy = out.doc
//   var img = copy.get('i1')
//   t.notNil(img, 'The image should be copied.')
//   t.end()
// })

test("Copying a paragraph", function(t) {
  var doc = fixture(simple)
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p2'],
    startOffset: 0,
    endPath: ['p2'],
    endOffset: 1
  })
  var args = {selection: sel}
  var out = copySelection(doc, args)
  var copy = out.doc
  var p2 = copy.get('p2')
  t.equal(p2.content, doc.get('p2').content, 'The whole paragraph should be copied.')
  t.end()
})

// FIXME: broken since introduction of file nodes
// test("Copying a node without properties", function(t) {
//   var doc = fixture(simple)
//   doc.create({
//     type: 'image',
//     id: 'i1',
//     src: 'foo'
//   })
//   doc.get('body').show('i1', 1)
//   var sel = doc.createSelection({
//     type: 'container',
//     containerId: 'body',
//     startPath: ['i1'],
//     startOffset: 0,
//     endPath: ['i1'],
//     endOffset: 1
//   })
//   var args = { selection: sel }
//   var out = copySelection(doc, args)
//   var copy = out.doc
//   var img = copy.get('i1')
//   t.notNil(img, 'The image should be copied.')
//   t.equal(img.src, 'foo')
//   t.end()
// })
