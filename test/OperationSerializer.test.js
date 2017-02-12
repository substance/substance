import { module } from 'substance-test'

import OperationSerializer from '../model/data/OperationSerializer'
import ObjectOperation from '../model/data/ObjectOperation'
import TextOperation from '../model/data/TextOperation'
import ArrayOperation from '../model/data/ArrayOperation'

const test = module('OperationSerializer')

test('Serializing create', function(t) {
  var p = { id: 'p1', type: 'paragraph', content: 'foo' }
  var op = ObjectOperation.Create(['p1'], p)
  var io = new OperationSerializer()
  var data = io.serialize(op)
  t.deepEqual(data, ['c', p.id, p])
  t.end()
})

test('Deserializing create', function(t) {
  var p = { id: 'p1', type: 'paragraph', content: 'foo' }
  var io = new OperationSerializer()
  var data = ['c', 'p1', p]
  var op = io.deserialize(data)
  t.ok(op.type, 'create')
  t.deepEqual(op.getValue(), p)
  t.end()
})

test('Serializing delete', function(t) {
  var p = { id: 'p1', type: 'paragraph', content: 'foo' }
  var op = ObjectOperation.Delete(['p1'], p)
  var io = new OperationSerializer()
  var data = io.serialize(op)
  t.deepEqual(data, ['d', p.id, p])
  t.end()
})

test('Deserializing delete', function(t) {
  var p = { id: 'p1', type: 'paragraph', content: 'foo' }
  var io = new OperationSerializer()
  var data = ['d', 'p1', p]
  var op = io.deserialize(data)
  t.ok(op.type, 'delete')
  t.deepEqual(op.getValue(), p)
  t.end()
})

test('Serializing set', function(t) {
  var op = ObjectOperation.Set(['p1', 'content'], 'foo', 'bar')
  var io = new OperationSerializer()
  var data = io.serialize(op)
  t.deepEqual(data, ['s', 'p1.content', 'bar', 'foo'])
  t.end()
})

test('Serializing set with null', function(t) {
  var op = ObjectOperation.Set(['p1', 'content'], null, null)
  var io = new OperationSerializer()
  var data = io.serialize(op)
  t.deepEqual(data, ['s', 'p1.content', null, null])
  t.end()
})

test('Serializing set with undefined', function(t) {
  // ATTENTION: undefined is not a valid JSON value, so it gets replaced
  // by null
  var op = ObjectOperation.Set(['p1', 'content'], undefined, undefined)
  var io = new OperationSerializer()
  var data = io.serialize(op)
  t.deepEqual(data, ['s', 'p1.content', undefined, undefined])
  t.end()
})

test('Deserializing set', function(t) {
  var io = new OperationSerializer()
  var data = ['s', 'p1.content', 'bar', 'foo']
  var op = io.deserialize(data)
  t.equal(op.type, 'set')
  t.deepEqual(op.getPath(), ['p1', 'content'])
  t.deepEqual(op.getValue(), 'bar')
  t.deepEqual(op.getOldValue(), 'foo')
  t.end()
})


test('Serializing text insert', function(t) {
  var op = ObjectOperation.Update(['p1', 'content'], TextOperation.Insert(3, 'foo'))
  var io = new OperationSerializer()
  var data = io.serialize(op)
  t.deepEqual(data, ['u', 'p1.content', 't+', 3, 'foo'])
  t.end()
})

test('Deserializing text insert', function(t) {
  var io = new OperationSerializer()
  var data = ['u', 'p1.content', 't+', 3, 'foo']
  var op = io.deserialize(data)
  t.ok(op.type, 'update')
  t.deepEqual(op.getPath(), ['p1', 'content'])
  var valueOp = op.getValueOp()
  t.ok(valueOp instanceof TextOperation, 'Value operation should be a TextOperation')
  t.equal(valueOp.type, 'insert')
  t.equal(valueOp.pos, 3)
  t.equal(valueOp.str, 'foo')
  t.end()
})

test('Serializing text delete', function(t) {
  var op = ObjectOperation.Update(['p1', 'content'], TextOperation.Delete(3, 'foo'))
  var io = new OperationSerializer()
  var data = io.serialize(op)
  t.deepEqual(data, ['u', 'p1.content', 't-', 3, 'foo'])
  t.end()
})

test('Deserializing text delete', function(t) {
  var io = new OperationSerializer()
  var data = ['u', 'p1.content', 't-', 3, 'foo']
  var op = io.deserialize(data)
  t.ok(op.type, 'update')
  t.deepEqual(op.getPath(), ['p1', 'content'])
  var valueOp = op.getValueOp()
  t.ok(valueOp instanceof TextOperation, 'Value operation should be a TextOperation')
  t.equal(valueOp.type, 'delete')
  t.equal(valueOp.pos, 3)
  t.equal(valueOp.str, 'foo')
  t.end()
})

test('Serializing an array insert', function(t) {
  var op = ObjectOperation.Update(['test', 'numbers'], ArrayOperation.Insert(3, 1234))
  var io = new OperationSerializer()
  var data = io.serialize(op)
  t.deepEqual(data, ['u', 'test.numbers', 'a+', 3, 1234])
  t.end()
})

test('Deserializing an array insert', function(t) {
  var io = new OperationSerializer()
  var data = ['u', 'test.numbers', 'a+', 3, 1234]
  var op = io.deserialize(data)
  t.ok(op.type, 'update')
  t.deepEqual(op.getPath(), ['test', 'numbers'])
  var valueOp = op.getValueOp()
  t.ok(valueOp instanceof ArrayOperation, 'Value operation should be a ArrayOperation')
  t.equal(valueOp.type, 'insert')
  t.equal(valueOp.pos, 3)
  t.equal(valueOp.val, 1234)
  t.end()
})

test('Serializing an array delete', function(t) {
  var op = ObjectOperation.Update(['test', 'numbers'], ArrayOperation.Delete(3, 1234))
  var io = new OperationSerializer()
  var data = io.serialize(op)
  t.deepEqual(data, ['u', 'test.numbers', 'a-', 3, 1234])
  t.end()
})

test('Deserializing an array delete', function(t) {
  var io = new OperationSerializer()
  var data = ['u', 'test.numbers', 'a-', 3, 1234]
  var op = io.deserialize(data)
  t.ok(op.type, 'update')
  t.deepEqual(op.getPath(), ['test', 'numbers'])
  var valueOp = op.getValueOp()
  t.ok(valueOp instanceof ArrayOperation, 'Value operation should be a ArrayOperation')
  t.equal(valueOp.type, 'delete')
  t.equal(valueOp.pos, 3)
  t.equal(valueOp.val, 1234)
  t.end()
})
