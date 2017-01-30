import { module } from 'substance-test'
import Document from '../model/Document'
import EditingInterface from '../model/EditingInterface'
import fixture from './fixture/createTestArticle'
import simple from './fixture/simple'

const test = module('paste')

test("Pasting plain text", function(t) {
  let { tx } = _fixture(simple)
  tx.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3
  })
  tx.paste('XXX')
  let p1 = tx.get('p1')
  t.equal(p1.content, '012XXX3456789')
  t.end()
})

test("Pasting a single paragraph", function(t) {
  let { tx } = _fixture(simple)
  let snippet = tx.createSnippet()
  let container = snippet.getContainer()
  let p = snippet.create({
    type: 'paragraph',
    id: Document.TEXT_SNIPPET_ID,
    content: 'AABBCC'
  })
  container.show(p.id)
  tx.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3,
    containerId: 'body'
  })
  tx.paste(snippet)
  let p1 = tx.get('p1')
  t.equal(p1.content, '012AABBCC3456789', 'Plain text should be inserted.')
  t.end()
})

test("Pasting annotated text", function(t) {
  let { tx } = _fixture(simple)
  tx.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3,
    containerId: 'body'
  })
  let snippet = tx.createSnippet()
  let container = snippet.getContainer()
  let p = snippet.create({
    type: 'paragraph',
    id: Document.TEXT_SNIPPET_ID,
    content: 'AABBCC'
  })
  container.show(p.id)
  snippet.create({
    type: 'strong',
    id: 's1',
    start: {
      path: [p.id, 'content'],
      offset: 2,
    },
    end: {
      offset: 4
    }
  })
  tx.paste(snippet)
  let p1 = tx.get('p1')
  t.equal(p1.content, '012AABBCC3456789', 'Plain text should be inserted.')
  let s1 = tx.get('s1')
  t.deepEqual(s1.path, [p1.id, 'content'], 'Annotation is bound to the correct path.')
  t.deepEqual([s1.start.offset, s1.end.offset], [5, 7], 'Annotation has correct range.')
  t.end()
})

test("Pasting two paragraphs", function(t) {
  let { tx } = _fixture(simple)
  let snippet = tx.createSnippet()
  let container = snippet.getContainer()
  let test1 = snippet.create({
    type: 'paragraph',
    id: 'test1',
    content: 'AA'
  })
  container.show(test1.id)
  let test2 = snippet.create({
    type: 'paragraph',
    id: 'test2',
    content: 'BB'
  })
  container.show(test2.id)
  tx.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3,
    containerId: 'body'
  })
  tx.paste(snippet)
  let body = tx.get('body')
  let p1 = tx.get('p1')
  t.equal(p1.content, '012AA', 'First part should be inserted into first paragraph.')
  t.equal(body.nodes[1], test2.id, 'Second part should go into a single paragraph.')
  t.equal(tx.get(body.nodes[2]).content, '3456789', 'Remaining part of first paragraph should be in a new paragraph.')
  t.equal(body.nodes[3], 'p2', 'After that should follow p2.')
  t.end()
})

function _fixture(seed) {
  let doc = fixture(seed)
  let tx = new EditingInterface(doc)
  return { doc: doc, tx: tx }
}
