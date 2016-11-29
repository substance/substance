import { module } from 'substance-test'
import Document from '../../model/Document'
import paste from '../../model/paste'
import fixture from '../fixtures/createTestArticle'
import simple from '../fixtures/simple'

const test = module('model/paste')

test("Pasting plain text", function(t) {
  var doc = fixture(simple)
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3
  })
  var args = {selection: sel, text: 'XXX'}
  paste(doc, args)
  var p1 = doc.get('p1')
  t.equal(p1.content, '012XXX3456789')
  t.end()
})

test("Pasting a single paragraph", function(t) {
  var doc = fixture(simple)
  var pasteDoc = doc.createSnippet()
  var container = pasteDoc.getContainer()
  var p = pasteDoc.create({
    type: 'paragraph',
    id: Document.TEXT_SNIPPET_ID,
    content: 'AABBCC'
  })
  container.show(p.id)
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3
  })
  var args = {selection: sel, doc: pasteDoc}
  paste(doc, args)
  var p1 = doc.get('p1')
  t.equal(p1.content, '012AABBCC3456789', 'Plain text should be inserted.')
  t.end()
})

test("Pasting annotated text", function(t) {
  var doc = fixture(simple)
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3
  })
  var pasteDoc = doc.createSnippet()
  var container = pasteDoc.getContainer()
  var p = pasteDoc.create({
    type: 'paragraph',
    id: Document.TEXT_SNIPPET_ID,
    content: 'AABBCC'
  })
  container.show(p.id)
  pasteDoc.create({
    type: 'strong',
    id: 's1',
    path: [p.id, 'content'],
    startOffset: 2,
    endOffset: 4
  })
  var args = {selection: sel, doc: pasteDoc}
  paste(doc, args)
  var p1 = doc.get('p1')
  t.equal(p1.content, '012AABBCC3456789', 'Plain text should be inserted.')
  var s1 = doc.get('s1')
  t.deepEqual(s1.path, [p1.id, 'content'], 'Annotation is bound to the correct path.')
  t.deepEqual([s1.startOffset, s1.endOffset], [5, 7], 'Annotation has correct range.')
  t.end()
})

test("Pasting two paragraphs", function(t) {
  var doc = fixture(simple)
  var pasteDoc = doc.createSnippet()
  var container = pasteDoc.getContainer()
  var test1 = pasteDoc.create({
    type: 'paragraph',
    id: 'test1',
    content: 'AA'
  })
  container.show(test1.id)
  var test2 = pasteDoc.create({
    type: 'paragraph',
    id: 'test2',
    content: 'BB'
  })
  container.show(test2.id)
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3
  })
  var args = {containerId: 'body', selection: sel, doc: pasteDoc}
  paste(doc, args)
  var body = doc.get('body')
  var p1 = doc.get('p1')
  t.equal(p1.content, '012AA', 'First part should be inserted into first paragraph.')
  t.equal(body.nodes[1], test2.id, 'Second part should go into a single paragraph.')
  t.equal(doc.get(body.nodes[2]).content, '3456789', 'Remaining part of first paragraph should be in a new paragraph.')
  t.equal(body.nodes[3], 'p2', 'After that should follow p2.')
  t.end()
})

// test("Pasting a table", function(t) {
//   var doc = fixture(simple)
//   var pasteDoc = doc.newInstance()
//   var tsv = [
//     ['A', 'B', 'C', 'D'].join('\t'),
//     ['1', '2', '3', '4'].join('\t'),
//     ['5', '6', '7', '8'].join('\t'),
//     ['9', '10', '11', '12'].join('\t'),
//   ].join('\n')
//   var container = pasteDoc.create({
//     type: "container",
//     id: Document.SNIPPET_ID,
//     nodes: []
//   })
//   var table = Table.fromTSV(pasteDoc, tsv)
//   container.show(table.id)
//   var sel = doc.createSelection({
//     type: 'property',
//     path: ['p1', 'content'],
//     startOffset: 3
//   })
//   var args = {containerId: 'body', selection: sel, doc: pasteDoc}
//   paste(doc, args)
//   var body = doc.get('body')
//   var p1 = doc.get('p1')
//   t.equal(p1.content, '012', 'First paragraph should be truncated.')
//   t.equal(doc.get(body.nodes[2]).content, '3456789', 'Remaining part of first paragraph should be in a new paragraph.')
//   t.equal(body.nodes[1], table.id, 'Table should be inserted between two paragraphs.')
//   t.equal(doc.get(table.id).toTSV(), tsv, 'TSV should be correct.')
// })
