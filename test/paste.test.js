import { test } from 'substance-test'
import { documentHelpers, EditingInterface, toUnixLineEndings } from 'substance'
import fixture from './shared/createTestArticle'
import simple from './fixture/simple'

test('paste: Pasting plain text', t => {
  const { tx } = _fixture(simple)
  tx.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3
  })
  tx.paste('XXX')
  const p1 = tx.get('p1')
  t.equal(p1.content, '012XXX3456789')
  t.end()
})

test('paste: Pasting a single paragraph', t => {
  const { tx } = _fixture(simple)
  const snippet = tx.createSnippet()
  const container = snippet.getContainer()
  const p = snippet.create({
    type: 'paragraph',
    id: documentHelpers.TEXT_SNIPPET_ID,
    content: 'AABBCC'
  })
  container.append(p.id)
  tx.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3,
    containerPath: ['body', 'nodes']
  })
  tx.paste(snippet)
  const p1 = tx.get('p1')
  t.equal(p1.content, '012AABBCC3456789', 'Plain text should be inserted.')
  t.end()
})

test('paste: Pasting annotated text', t => {
  const { tx } = _fixture(simple)
  tx.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3,
    containerPath: ['body', 'nodes']
  })
  const snippet = tx.createSnippet()
  const container = snippet.getContainer()
  const p = snippet.create({
    type: 'paragraph',
    id: documentHelpers.TEXT_SNIPPET_ID,
    content: 'AABBCC'
  })
  container.append(p.id)
  snippet.create({
    type: 'strong',
    id: 's1',
    start: {
      path: [p.id, 'content'],
      offset: 2
    },
    end: {
      offset: 4
    }
  })
  tx.paste(snippet)
  const p1 = tx.get('p1')
  t.equal(p1.content, '012AABBCC3456789', 'Plain text should be inserted.')
  const s1 = tx.get('s1')
  t.deepEqual(s1.start.path, [p1.id, 'content'], 'Annotation is bound to the correct path.')
  t.deepEqual([s1.start.offset, s1.end.offset], [5, 7], 'Annotation has correct range.')
  t.end()
})

test('paste: Pasting two paragraphs', t => {
  const { tx } = _fixture(simple)
  const snippet = tx.createSnippet()
  const container = snippet.getContainer()
  const test1 = snippet.create({
    type: 'paragraph',
    id: 'test1',
    content: 'AA'
  })
  container.append(test1.id)
  const test2 = snippet.create({
    type: 'paragraph',
    id: 'test2',
    content: 'BB'
  })
  container.append(test2.id)
  tx.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3,
    containerPath: ['body', 'nodes']
  })
  tx.paste(snippet)
  const body = tx.get('body')
  const p1 = tx.get('p1')
  t.equal(p1.content, '012AA', 'First part should be inserted into first paragraph.')
  t.equal(body.nodes[1], test2.id, 'Second part should go into a single paragraph.')
  t.equal(tx.get(body.nodes[2]).content, '3456789', 'Remaining part of first paragraph should be in a new paragraph.')
  t.equal(body.nodes[3], 'p2', 'After that should follow p2.')
  t.end()
})

test('paste: Pasting two structured content into TextProperty (#1111)', (t) => {
  const { tx } = _fixture(simple)
  const detached = tx.create({
    id: 'detached',
    type: 'paragraph',
    content: '012345'
  })
  const snippet = tx.createSnippet()
  const container = snippet.getContainer()
  const test1 = snippet.create({
    type: 'paragraph',
    id: 'test1',
    content: 'AA'
  })
  container.append(test1.id)
  const test2 = snippet.create({
    type: 'paragraph',
    id: 'test2',
    content: 'BB'
  })
  container.append(test2.id)
  tx.setSelection({
    type: 'property',
    path: detached.getPath(),
    startOffset: 3,
    // 'detached' is not part of a container
    containerPath: null
  })
  tx.paste(snippet)
  const actual = toUnixLineEndings(detached.content)
  t.equal(actual, '012AA BB345', 'Plain text should have been inserted.')
  t.end()
})

function _fixture (seed) {
  const doc = fixture(seed)
  const tx = new EditingInterface(doc)
  return { doc: doc, tx: tx }
}
