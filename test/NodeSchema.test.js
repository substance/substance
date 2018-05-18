import { module } from 'substance-test'
import { Node } from 'substance'

const test = module('NodeSchema')

test('properties of type ["object"] (#1169)', (t) => {
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

test('property with multiple reference types', (t) => {
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

test('property with invalid multi-type', (t) => {
  class MyNode extends Node {}
  t.throws(() => {
    MyNode.define({
      type: 'my-node',
      content: { type: ['object', 'foo'], default: [] }
    })
  }, 'Multi-types must consist of node types.')
  t.end()
})
