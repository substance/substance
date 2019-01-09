import { test } from 'substance-test'
import { Document, DocumentSchema, DocumentNode, CHILD, OPTIONAL, CHILDREN, TextNode, PropertyAnnotation } from 'substance'

/*
 Tests:
  - CHILDREN relationship
    - parents should change when setting children array

  - XPATH
    similar to above (maybe check xpath in other tests already)
*/

class Parent extends DocumentNode {}
Parent.schema = {
  type: 'parent',
  foo: OPTIONAL(CHILD('child'))
}
class Child extends DocumentNode {}
Child.schema = {
  type: 'child'
}
class SomeText extends TextNode {}
SomeText.schema = { type: 'some-text' }
class SomeAnno extends PropertyAnnotation {}
SomeAnno.schema = { type: 'some-anno' }

test('ParentNode: nodes referenced via CHILD should have parent set after creation', t => {
  let doc = new Document(new DocumentSchema({ nodes: [Parent, Child], DocumentClass: Document }))
  let child = doc.create({ type: 'child', id: 'b' })
  let parent = doc.create({ type: 'parent', id: 'a', foo: 'b' })
  t.ok(child.getParent() === parent, 'child should have parent')
  t.deepEqual(child.getXpath().toArray(), [{ id: 'a', type: 'parent' }, { id: 'b', type: 'child', property: 'foo' }], 'xpath of child node should be correct')
  t.end()
})

test('ParentNode: CHILD should have parent even when created in wrong order', t => {
  let doc = new Document(new DocumentSchema({ nodes: [Parent, Child], DocumentClass: Document }))
  let parent = doc.create({ type: 'parent', id: 'a', foo: 'b' })
  let child = doc.create({ type: 'child', id: 'b' })
  t.ok(child.getParent() === parent, 'child should have parent')
  t.deepEqual(child.getXpath().toArray(), [{ id: 'a', type: 'parent' }, { id: 'b', type: 'child', property: 'foo' }], 'xpath of child node should be correct')
  t.end()
})

test('ParentNode: setting CHILD to null should remove parent link', t => {
  let doc = new Document(new DocumentSchema({ nodes: [Parent, Child], DocumentClass: Document }))
  let child = doc.create({ type: 'child', id: 'b' })
  doc.create({ type: 'parent', id: 'a', foo: 'b' })
  doc.set(['a', 'foo'], null)
  t.isNil(child.getParent(), 'child should have no parent')
  t.deepEqual(child.getXpath().toArray(), [{ id: 'b', type: 'child' }], 'xpath of child node should be correct')
  t.end()
})

test('ParentNode: parents should be updated when replacing a CHILD', t => {
  let doc = new Document(new DocumentSchema({ nodes: [Parent, Child], DocumentClass: Document }))
  let child1 = doc.create({ type: 'child', id: 'b' })
  let child2 = doc.create({ type: 'child', id: 'c' })
  let parent = doc.create({ type: 'parent', id: 'a' })
  doc.set(['a', 'foo'], child1.id)
  t.ok(child1.getParent() === parent, 'child1 should have parent')
  t.isNil(child2.getParent(), 'child2 should have no parent')
  t.deepEqual(child1.getXpath().toArray(), [{ id: 'a', type: 'parent' }, { id: 'b', type: 'child', property: 'foo' }], 'xpath of child1 should be correct')
  t.deepEqual(child2.getXpath().toArray(), [{ id: 'c', type: 'child' }], 'xpath of child2 should be correct')
  doc.set(['a', 'foo'], child2.id)
  t.isNil(child1.getParent(), 'child1 should have no parent')
  t.ok(child2.getParent() === parent, 'child2 should have parent')
  t.deepEqual(child1.getXpath().toArray(), [{ id: 'b', type: 'child' }], 'xpath of child1 should be correct')
  t.deepEqual(child2.getXpath().toArray(), [{ id: 'a', type: 'parent' }, { id: 'c', type: 'child', property: 'foo' }], 'xpath of child2 should be correct')
  t.end()
})

class ParentWithChildren extends DocumentNode {}
ParentWithChildren.schema = {
  type: 'parent',
  foo: CHILDREN('child')
}

test('ParentNode: CHILDREN should have parent', t => {
  let doc = new Document(new DocumentSchema({ nodes: [ParentWithChildren, Child], DocumentClass: Document }))
  let child1 = doc.create({ type: 'child', id: 'b' })
  let child2 = doc.create({ type: 'child', id: 'c' })
  let parent = doc.create({ type: 'parent', id: 'a', foo: ['b', 'c'] })
  t.ok(child1.getParent() === parent, 'child1 should have parent')
  t.ok(child2.getParent() === parent, 'child2 should have parent')
  t.deepEqual(child1.getXpath().toArray(), [{ id: 'a', type: 'parent' }, { id: 'b', type: 'child', property: 'foo', pos: 0 }], 'xpath of child1 should be correct')
  t.deepEqual(child2.getXpath().toArray(), [{ id: 'a', type: 'parent' }, { id: 'c', type: 'child', property: 'foo', pos: 1 }], 'xpath of child2 should be correct')
  t.end()
})

test('ParentNode: CHILDREN should have parent even if created in wrong order', t => {
  let doc = new Document(new DocumentSchema({ nodes: [ParentWithChildren, Child], DocumentClass: Document }))
  let parent = doc.create({ type: 'parent', id: 'a', foo: ['b', 'c'] })
  let child1 = doc.create({ type: 'child', id: 'b' })
  let child2 = doc.create({ type: 'child', id: 'c' })
  t.ok(child1.getParent() === parent, 'child1 should have parent')
  t.ok(child2.getParent() === parent, 'child2 should have parent')
  t.deepEqual(child1.getXpath().toArray(), [{ id: 'a', type: 'parent' }, { id: 'b', type: 'child', property: 'foo', pos: 0 }], 'xpath of child1 should be correct')
  t.deepEqual(child2.getXpath().toArray(), [{ id: 'a', type: 'parent' }, { id: 'c', type: 'child', property: 'foo', pos: 1 }], 'xpath of child2 should be correct')
  t.end()
})

test('ParentNode: inserted CHILDREN should have parent', t => {
  let doc = new Document(new DocumentSchema({ nodes: [ParentWithChildren, Child], DocumentClass: Document }))
  let parent = doc.create({ type: 'parent', id: 'a' })
  let child1 = doc.create({ type: 'child', id: 'b' })
  doc.update([parent.id, 'foo'], { type: 'insert', pos: 0, value: child1.id })
  t.ok(child1.getParent() === parent, 'child1 should have parent')
  t.deepEqual(child1.getXpath().toArray(), [{ id: 'a', type: 'parent' }, { id: 'b', type: 'child', property: 'foo', pos: 0 }], 'xpath of child1 should be correct')
  let child2 = doc.create({ type: 'child', id: 'c' })
  doc.update([parent.id, 'foo'], { type: 'insert', pos: 0, value: child2.id })
  t.ok(child2.getParent() === parent, 'child2 should have parent')
  t.deepEqual(child1.getXpath().toArray(), [{ id: 'a', type: 'parent' }, { id: 'b', type: 'child', property: 'foo', pos: 1 }], 'xpath of child1 should be correct')
  t.deepEqual(child2.getXpath().toArray(), [{ id: 'a', type: 'parent' }, { id: 'c', type: 'child', property: 'foo', pos: 0 }], 'xpath of child2 should be correct')
  t.end()
})

test('ParentNode: removed CHILDREN should have no parent', t => {
  let doc = new Document(new DocumentSchema({ nodes: [ParentWithChildren, Child], DocumentClass: Document }))
  let child1 = doc.create({ type: 'child', id: 'b' })
  let child2 = doc.create({ type: 'child', id: 'c' })
  let parent = doc.create({ type: 'parent', id: 'a', foo: ['b', 'c'] })
  doc.update([parent.id, 'foo'], { type: 'delete', pos: 0 })
  t.isNil(child1.getParent(), 'child1 should have no parent anymore')
  t.ok(child2.getParent() === parent, 'child2 should have parent')
  t.deepEqual(child1.getXpath().toArray(), [{ id: 'b', type: 'child' }], 'xpath of child1 should be correct')
  t.deepEqual(child2.getXpath().toArray(), [{ id: 'a', type: 'parent' }, { id: 'c', type: 'child', property: 'foo', pos: 0 }], 'xpath of child2 should be correct')
  t.end()
})

test('ParentNode: clearing CHILDREN should remove parent', t => {
  let doc = new Document(new DocumentSchema({ nodes: [ParentWithChildren, Child], DocumentClass: Document }))
  let child1 = doc.create({ type: 'child', id: 'b' })
  let child2 = doc.create({ type: 'child', id: 'c' })
  let parent = doc.create({ type: 'parent', id: 'a', foo: ['b', 'c'] })
  doc.set([parent.id, 'foo'], [])
  t.isNil(child1.getParent(), 'child1 should have no parent anymore')
  t.isNil(child2.getParent(), 'child2 should have no parent anymore')
  t.deepEqual(child1.getXpath().toArray(), [{ id: 'b', type: 'child' }], 'xpath of child1 should be correct')
  t.deepEqual(child2.getXpath().toArray(), [{ id: 'c', type: 'child' }], 'xpath of child2 should be correct')
  t.end()
})

test('ParentNode: setting CHILDREN should update parent appropriately', t => {
  let doc = new Document(new DocumentSchema({ nodes: [ParentWithChildren, Child], DocumentClass: Document }))
  let child1 = doc.create({ type: 'child', id: 'b' })
  let child2 = doc.create({ type: 'child', id: 'c' })
  let child3 = doc.create({ type: 'child', id: 'd' })
  let parent = doc.create({ type: 'parent', id: 'a', foo: ['b', 'c'] })
  doc.set([parent.id, 'foo'], ['c', 'd'])
  t.isNil(child1.getParent(), 'child1 should have no parent anymore')
  t.ok(child2.getParent() === parent, 'child2 should have parent')
  t.ok(child3.getParent() === parent, 'child3 should have parent')
  t.deepEqual(child1.getXpath().toArray(), [{ id: 'b', type: 'child' }], 'xpath of child1 should be correct')
  t.deepEqual(child2.getXpath().toArray(), [{ id: 'a', type: 'parent' }, { id: 'c', type: 'child', property: 'foo', pos: 0 }], 'xpath of child2 should be correct')
  t.deepEqual(child3.getXpath().toArray(), [{ id: 'a', type: 'parent' }, { id: 'd', type: 'child', property: 'foo', pos: 1 }], 'xpath of child3 should be correct')
  t.end()
})

test('ParentNode: creating an annotation should set parent', t => {
  let doc = new Document(new DocumentSchema({ nodes: [SomeText, SomeAnno], DocumentClass: Document }))
  let text = doc.create({ type: 'some-text', id: 'text', content: 'abcdefgh' })
  let anno = doc.create({ type: 'some-anno', id: 'anno', start: { path: ['text', 'content'], offset: 1 }, end: { offset: 3 } })
  t.equal(anno.getParent(), text, 'annotation should have text node as parent')
  t.deepEqual(anno.getXpath().toArray(), [{ id: 'text', type: 'some-text' }, { id: 'anno', type: 'some-anno', property: 'content' }], 'xpath of anno should be correct')
  t.end()
})

test('ParentNode: setting the path of an annotation should update the parent accordingly', t => {
  let doc = new Document(new DocumentSchema({ nodes: [SomeText, SomeAnno], DocumentClass: Document }))
  doc.create({ type: 'some-text', id: 'text1', content: 'abcdefgh' })
  let text2 = doc.create({ type: 'some-text', id: 'text2', content: 'abcdefgh' })
  let anno = doc.create({ type: 'some-anno', id: 'anno', start: { path: ['text', 'content'], offset: 1 }, end: { offset: 3 } })
  doc.set([anno.id, 'start', 'path'], ['text2', 'content'])
  t.equal(anno.getParent(), text2, 'annotation should have text2 as parent')
  t.end()
})
