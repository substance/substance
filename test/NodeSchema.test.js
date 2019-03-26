import { test } from 'substance-test'
import { Node, ENUM } from 'substance'

test('NodeSchema: properties of type ["object"] (#1169)', t => {
  class MyNode extends Node {}
  MyNode.schema = {
    type: 'my-node',
    content: { type: ['object'], default: [] }
  }
  let property = MyNode.schema.getProperty('content')
  // props with default values are optional
  t.ok(property.isOptional(), 'property should be optional')
  t.ok(property.isArray(), 'property should be an array type')
  t.deepEqual(property.type, ['array', 'object'], 'property should have correct type')
  t.doesNotThrow(() => {
    new MyNode({ id: 'mynode' }) // eslint-disable-line no-new
  }, 'can create node without content')
  t.throws(() => {
    new MyNode({ id: 'mynode', content: 'foo' }) // eslint-disable-line no-new
  }, 'can not create node without invalid data')
  t.end()
})

test('NodeSchema: reference property with multiple target types', t => {
  class MyNode extends Node {}
  MyNode.schema = {
    type: 'my-node',
    content: { type: ['foo', 'bar'], default: [] }
  }
  let property = MyNode.schema.getProperty('content')
  // props with default values are optional
  t.ok(property.isArray(), 'property should be an array type')
  t.deepEqual(property.type, ['array', 'id'], 'property should have correct type')
  t.deepEqual(property.targetTypes, ['foo', 'bar'], 'property should have targetTypes set')
  t.end()
})

test('NodeSchema: reference property with multiple target types (canonical notation)', t => {
  class MyNode extends Node {}
  MyNode.schema = {
    type: 'my-node',
    content: { type: ['array', 'id'], targetTypes: ['foo', 'bar'], default: [] }
  }
  let property = MyNode.schema.getProperty('content')
  // props with default values are optional
  t.ok(property.isArray(), 'property should be an array type')
  t.ok(property.isReference(), 'property should be a reference type')
  t.deepEqual(property.type, ['array', 'id'], 'property should have correct type')
  t.deepEqual(property.targetTypes, ['foo', 'bar'], 'property should have targetTypes set')
  t.end()
})

test('NodeSchema: property with invalid multi-type', t => {
  class MyNode extends Node {}
  t.throws(() => {
    // HACK: somehow we need this as otherwise the code is not executed (?!)
    MyNode._defineSchema({
      type: 'my-node',
      content: { type: ['object', 'foo'], default: [] }
    })
  }, 'Multi-types must consist of node types.')
  t.end()
})

test('NodeSchema: property of node type should be considered a reference', t => {
  class MyNode extends Node {}
  MyNode.schema = {
    type: 'my-node',
    foo: { type: 'foo' }
  }
  let property = MyNode.schema.getProperty('foo')
  // props with default values are optional
  t.ok(property.isReference(), 'property should be a reference type')
  t.deepEqual(property.type, 'id', 'property should have id type')
  t.deepEqual(property.targetTypes, ['foo'], 'property should have correct target type')
  t.end()
})

test('NodeSchema: Node inheritance', t => {
  class ParentNode extends Node {}
  ParentNode.schema = {
    type: 'parent',
    foo: 'string'
  }
  class ChildNode extends ParentNode {}
  ChildNode.schema = {
    type: 'child',
    bar: 'number'
  }
  let schema = ChildNode.schema
  t.ok(Node.isInstanceOf(ChildNode, 'parent'), "'child' should be considered an instance of 'parent'")
  t.equal(schema.getProperty('foo').type, 'string', "'child' should have a string property 'foo'")
  t.equal(schema.getProperty('bar').type, 'number', "'child' should have a number property 'bar'")
  t.end()
})

test('NodeSchema: enum type', t => {
  class MyNode extends Node { }
  MyNode.schema = {
    type: 'mynode',
    foo: ENUM(['a', 'b', 'c'])
  }
  let schema = MyNode.schema
  let foo = schema.getProperty('foo')
  t.equal(foo.type, 'enum', "node should have an enum type property 'foo'")
  t.deepEqual(foo.values, ['a', 'b', 'c'], 'with defined values')
  t.end()
})
