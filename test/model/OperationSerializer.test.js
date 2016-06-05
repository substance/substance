'use strict';

require('../QUnitExtensions');

var OperationSerializer = require('../../model/data/OperationSerializer');
var ObjectOperation = require('../../model/data/ObjectOperation');
var TextOperation = require('../../model/data/TextOperation');
var ArrayOperation = require('../../model/data/ArrayOperation');

QUnit.module('model/data/OperationSerializer');

QUnit.test('Serializing create', function(assert) {
  var p = { id: 'p1', type: 'paragraph', content: 'foo' };
  var op = ObjectOperation.Create(['p1'], p);
  var io = new OperationSerializer();
  var data = io.serialize(op);
  assert.deepEqual(data, ['c', p.id, p]);
});

QUnit.test('Deserializing create', function(assert) {
  var p = { id: 'p1', type: 'paragraph', content: 'foo' };
  var io = new OperationSerializer();
  var data = ['c', 'p1', p];
  var op = io.deserialize(data);
  assert.ok(op.type, 'create');
  assert.deepEqual(op.getValue(), p);
});

QUnit.test('Serializing delete', function(assert) {
  var p = { id: 'p1', type: 'paragraph', content: 'foo' };
  var op = ObjectOperation.Delete(['p1'], p);
  var io = new OperationSerializer();
  var data = io.serialize(op);
  assert.deepEqual(data, ['d', p.id, p]);
});

QUnit.test('Deserializing delete', function(assert) {
  var p = { id: 'p1', type: 'paragraph', content: 'foo' };
  var io = new OperationSerializer();
  var data = ['d', 'p1', p];
  var op = io.deserialize(data);
  assert.ok(op.type, 'delete');
  assert.deepEqual(op.getValue(), p);
});

QUnit.test('Serializing set', function(assert) {
  var op = ObjectOperation.Set(['p1', 'content'], 'foo', 'bar');
  var io = new OperationSerializer();
  var data = io.serialize(op);
  assert.deepEqual(data, ['s', 'p1.content', 'bar', 'foo']);
});

QUnit.test('Serializing set with null', function(assert) {
  var op = ObjectOperation.Set(['p1', 'content'], null, null);
  var io = new OperationSerializer();
  var data = io.serialize(op);
  assert.deepEqual(data, ['s', 'p1.content', null, null]);
});

QUnit.test('Serializing set with undefined', function(assert) {
  // ATTENTION: undefined is not a valid JSON value, so it gets replaced
  // by null
  var op = ObjectOperation.Set(['p1', 'content'], undefined, undefined);
  var io = new OperationSerializer();
  var data = io.serialize(op);
  assert.deepEqual(data, ['s', 'p1.content', undefined, undefined]);
});

QUnit.test('Deserializing set', function(assert) {
  var io = new OperationSerializer();
  var data = ['s', 'p1.content', 'bar', 'foo'];
  var op = io.deserialize(data);
  assert.equal(op.type, 'set');
  assert.deepEqual(op.getPath(), ['p1', 'content']);
  assert.deepEqual(op.getValue(), 'bar');
  assert.deepEqual(op.getOldValue(), 'foo');
});


QUnit.test('Serializing text insert', function(assert) {
  var op = ObjectOperation.Update(['p1', 'content'], TextOperation.Insert(3, 'foo'));
  var io = new OperationSerializer();
  var data = io.serialize(op);
  assert.deepEqual(data, ['u', 'p1.content', 't+', 3, 'foo']);
});

QUnit.test('Deserializing text insert', function(assert) {
  var io = new OperationSerializer();
  var data = ['u', 'p1.content', 't+', 3, 'foo'];
  var op = io.deserialize(data);
  assert.ok(op.type, 'update');
  assert.deepEqual(op.getPath(), ['p1', 'content']);
  var valueOp = op.getValueOp();
  assert.ok(valueOp instanceof TextOperation, 'Value operation should be a TextOperation');
  assert.equal(valueOp.type, 'insert');
  assert.equal(valueOp.pos, 3);
  assert.equal(valueOp.str, 'foo');
});

QUnit.test('Serializing text delete', function(assert) {
  var op = ObjectOperation.Update(['p1', 'content'], TextOperation.Delete(3, 'foo'));
  var io = new OperationSerializer();
  var data = io.serialize(op);
  assert.deepEqual(data, ['u', 'p1.content', 't-', 3, 'foo']);
});

QUnit.test('Deserializing text delete', function(assert) {
  var io = new OperationSerializer();
  var data = ['u', 'p1.content', 't-', 3, 'foo'];
  var op = io.deserialize(data);
  assert.ok(op.type, 'update');
  assert.deepEqual(op.getPath(), ['p1', 'content']);
  var valueOp = op.getValueOp();
  assert.ok(valueOp instanceof TextOperation, 'Value operation should be a TextOperation');
  assert.equal(valueOp.type, 'delete');
  assert.equal(valueOp.pos, 3);
  assert.equal(valueOp.str, 'foo');
});

QUnit.test('Serializing an array insert', function(assert) {
  var op = ObjectOperation.Update(['test', 'numbers'], ArrayOperation.Insert(3, 1234));
  var io = new OperationSerializer();
  var data = io.serialize(op);
  assert.deepEqual(data, ['u', 'test.numbers', 'a+', 3, 1234]);
});

QUnit.test('Deserializing an array insert', function(assert) {
  var io = new OperationSerializer();
  var data = ['u', 'test.numbers', 'a+', 3, 1234];
  var op = io.deserialize(data);
  assert.ok(op.type, 'update');
  assert.deepEqual(op.getPath(), ['test', 'numbers']);
  var valueOp = op.getValueOp();
  assert.ok(valueOp instanceof ArrayOperation, 'Value operation should be a ArrayOperation');
  assert.equal(valueOp.type, 'insert');
  assert.equal(valueOp.pos, 3);
  assert.equal(valueOp.val, 1234);
});

QUnit.test('Serializing an array delete', function(assert) {
  var op = ObjectOperation.Update(['test', 'numbers'], ArrayOperation.Delete(3, 1234));
  var io = new OperationSerializer();
  var data = io.serialize(op);
  assert.deepEqual(data, ['u', 'test.numbers', 'a-', 3, 1234]);
});

QUnit.test('Deserializing an array delete', function(assert) {
  var io = new OperationSerializer();
  var data = ['u', 'test.numbers', 'a-', 3, 1234];
  var op = io.deserialize(data);
  assert.ok(op.type, 'update');
  assert.deepEqual(op.getPath(), ['test', 'numbers']);
  var valueOp = op.getValueOp();
  assert.ok(valueOp instanceof ArrayOperation, 'Value operation should be a ArrayOperation');
  assert.equal(valueOp.type, 'delete');
  assert.equal(valueOp.pos, 3);
  assert.equal(valueOp.val, 1234);
});
