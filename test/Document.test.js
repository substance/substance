import { test } from 'substance-test'
import { pick } from 'substance'

import fixture from './fixture/createTestArticle'
import simple from './fixture/simple'

test('Document: Create null selection.', function (t) {
  let doc = fixture(simple)
  let sel = doc.createSelection(null)
  t.ok(sel.isNull(), 'Selection should be null.')
  t.end()
})

test('Document: Create collapsed property selection.', function (t) {
  let doc = fixture(simple)
  let sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3
  })
  t.ok(sel.isPropertySelection(), 'Selection should be a property selection.')
  t.ok(sel.isCollapsed(), 'Selection should be collapsed.')
  t.deepEqual(sel.start.path, ['p1', 'content'], 'path should be correct.')
  t.deepEqual(sel.start.offset, 3, 'start offset should be correct.')
  t.end()
})

test('Document: Create expanded property selection.', function (t) {
  let doc = fixture(simple)
  let sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 1,
    endOffset: 4
  })
  t.ok(sel.isPropertySelection(), 'Selection should be a property selection.')
  t.notOk(sel.isCollapsed(), 'Selection should not be collapsed.')
  t.deepEqual(sel.start.path, ['p1', 'content'], 'path should be correct.')
  t.deepEqual(sel.start.offset, 1, 'start offset should be correct.')
  t.deepEqual(sel.end.offset, 4, 'end offset should be correct.')
  t.end()
})

test('Document: Node.toJSON() should not export undefined optional properties', function (t) {
  let doc = fixture(simple)
  let p = doc.create({
    type: 'paragraph',
    id: 'p',
    content: ''
  })
  t.deepEqual(p.toJSON(), { type: 'paragraph', id: 'p', content: '', textAlign: 'left' }, 'JSON should be correct.')
  t.end()
})

test('Document: Setting a node property with DocumentNode.set()', t => {
  let doc = fixture(simple)
  let p1 = doc.get('p1')
  p1.set('content', 'XXX')
  t.equal(p1.content, 'XXX', 'property should have changed')
  t.end()
})

test('Document: Assigning multiple properties with DocumentNode.assign()', t => {
  let doc = fixture()
  let node = doc.create({
    type: 'structured-node',
    id: 'sn'
  })
  let props = {
    title: 'aaa',
    body: 'bbb',
    caption: 'ccc'
  }
  node.assign(props)
  t.deepEqual(pick(node, ['title', 'body', 'caption']), props, 'properties should have changed')
  t.end()
})
