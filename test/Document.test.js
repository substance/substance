import { test } from 'substance-test'
import {
  CHILD, CHILDREN, Document, DocumentSchema, DocumentNode, map, pick
} from 'substance'
import fixture from './fixture/createTestArticle'
import simple from './fixture/simple'
import getTestConfig from './fixture/getTestConfig';

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

test('Document: node.find()', t => {
  let doc = fixture(simple)
  let body = doc.get('body')
  let p2 = body.find('#p2')
  t.notNil(p2, 'body.find(#p2) should find a node')
  t.equal(p2.id, 'p2', '.. with correct id')
  doc.create({ type: 'strong', start: { path: p2.getPath(), offset: 1 }, end: { offset: 3 } })
  let strong = p2.find('strong')
  t.notNil(strong, 'p2.find(strong) should find a node')
  t.equal(strong.type, 'strong', '.. of correct type')
  t.end()
})

class Parent extends DocumentNode {}
Parent.schema = {
  type: 'parent',
  child: CHILD('child')
}
class Child extends DocumentNode {}
Child.schema = {
  type: 'child',
  foo: { type: 'string', default: '' }
}
class ParentWithChildren extends DocumentNode {}
ParentWithChildren.schema = {
  type: 'parent-with-children',
  children: CHILDREN('child')
}

test('Document: resolve() a single id', t => {
  let doc = new Document(new DocumentSchema({ nodes: [Parent, Child], DocumentClass: Document }))
  let child = doc.create({ type: 'child', id: 'c1' })
  doc.create({ type: 'parent', id: 'p1', child: 'c1' })
  t.equal(doc.resolve(['p1', 'child']), child, 'resolve() should provide a referenced node')
  t.end()
})

test('Document: resolve() multiple ids', t => {
  let doc = new Document(new DocumentSchema({ nodes: [ParentWithChildren, Child], DocumentClass: Document }))
  let c1 = doc.create({ type: 'child', id: 'c1' })
  let c2 = doc.create({ type: 'child', id: 'c2' })
  doc.create({ type: 'parent-with-children', id: 'p1', children: ['c1', 'c2'] })
  t.deepEqual(doc.resolve(['p1', 'children']), [c1, c2], 'resolve() should provide referenced nodes')
  t.end()
})

test('Document: resolve() provides values like get() for non-reference values', t => {
  let doc = new Document(new DocumentSchema({ nodes: [Child], DocumentClass: Document }))
  doc.create({ type: 'child', id: 'c1', foo: 'bar' })
  t.equal(doc.resolve(['c1', 'foo']), 'bar', 'resolve() should provide a primitive values')
  t.end()
})

test('Document: resolve() throws for non-existing properties in strict mode', t => {
  let doc = new Document(new DocumentSchema({ nodes: [Child], DocumentClass: Document }))
  doc.create({ type: 'child', id: 'c1', foo: 'bar' })
  t.equal(doc.resolve(['c1', 'bla']), undefined, 'resolve() should return undefined in not-strict mode')
  t.throws(() => {
    doc.resolve(['c1', 'bla'], 'strict')
  }, /Invalid path/, 'resolve() should throw for invalid paths in strict mode')
  t.end()
})

test('Document: setting text', t => {
  let config = getTestConfig()
  let doc = new Document(config.getSchema())
  let p = doc.create({ type: 'paragraph', content: 'abcdefg' })
  doc.create({ type: 'strong', start: { path: p.getPath(), offset: 1 }, end: { offset: 3 } })
  let annos = map(p.getAnnotations())
  t.equal(annos.length, 1, 'initially there should be one annotation on the paragraph')
  p.setText('foo')
  t.equal(p.content, 'foo', 'the text content should have been updated')
  t.equal(map(p.getAnnotations()).length, 0, 'no annotation should be left on the paragraph')
  t.nil(doc.get(annos[0].id), 'the old annotation should have been removed from the document')
  t.end()
})
