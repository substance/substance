import { module } from 'substance-test'
import { ObjectOperation, ArrayOperation, TextOperation, PathObject, cloneDeep } from 'substance'

const test = module('ObjectOperation')

function checkObjectOperationTransform (test, a, b, input, expected) {
  let ops = ObjectOperation.transform(a, b)
  let output = ops[1].apply(a.apply(cloneDeep(input)))
  test.deepEqual(output, expected, `(b' o a)('${JSON.stringify(input)}') == '${JSON.stringify(expected)}' with a=${a.toString()}, b'=${ops[1].toString()}`)
  output = ops[0].apply(b.apply(cloneDeep(input)))
  test.deepEqual(output, expected, `(a' o b)('${JSON.stringify(input)}') == '${JSON.stringify(expected)}' with b=${b.toString()}, a'=${ops[0].toString()}`)
}

test('Creating values.', (t) => {
  let path = ['a']
  let val = { bla: 'blupp' }
  let expected = {a: { bla: 'blupp' } }
  let op = ObjectOperation.Create(path, val)
  let obj = {}
  op.apply(obj)
  t.deepEqual(obj, expected, 'Should create value.')
  t.end()
})

test('Creating nested values.', (t) => {
  let path = ['a', 'b']
  let val = { bla: 'blupp' }
  let expected = {a: { b: { bla: 'blupp' } } }
  let op = ObjectOperation.Create(path, val)
  let obj = {'a': {}}
  op.apply(obj)
  t.deepEqual(obj, expected, 'Should create nested value.')
  t.end()
})

test('Deleting values.', (t) => {
  let path = ['a']
  let val = 'bla'
  let op = ObjectOperation.Delete(path, val)
  let expected = {}
  let obj = {'a': 'bla'}
  op.apply(obj)
  t.deepEqual(obj, expected, 'Should delete value.')
  t.end()
})

test('Deleting nested values.', (t) => {
  let path = ['a', 'b']
  let val = 'bla'
  let op = ObjectOperation.Delete(path, val)
  let expected = { a: {} }
  let obj = { a: { b: 'bla'} }
  op.apply(obj)
  t.deepEqual(obj, expected, 'Should delete nested value.')
  t.end()
})

test('Updating a text property.', (t) => {
  let obj = {a: 'bla'}
  let path = ['a']
  let op1 = ObjectOperation.Update(path, TextOperation.Delete(2, 'a'))
  let op2 = ObjectOperation.Update(path, TextOperation.Insert(2, 'upp'))
  let expected = {a: 'blupp'}
  op1.apply(obj)
  op2.apply(obj)
  t.deepEqual(obj, expected)
  t.end()
})

test('Updating an array property.', (t) => {
  let obj = {a: [1, 2, 3, 4, 5]}
  let path = ['a']
  let op1 = ObjectOperation.Update(path, ArrayOperation.Delete(2, 3))
  let op2 = ObjectOperation.Update(path, ArrayOperation.Insert(4, 6))
  let expected = {a: [1, 2, 4, 5, 6]}
  op1.apply(obj)
  op2.apply(obj)
  t.deepEqual(obj, expected)
  t.end()
})

test('Creating an update operation with invalid diff.', (t) => {
  t.throws(function () {
    ObjectOperation.Update(['test'], 'foo')
  }, 'Should throw.')
  t.end()
})

test('Creating a top-level property using id.', (t) => {
  let obj = {}
  let id = 'foo'
  let op = ObjectOperation.Create(id, 'bar')
  let expected = { 'foo': 'bar' }
  op.apply(obj)
  t.deepEqual(obj, expected)
  t.end()
})

test('Deleting a top-level property using id.', (t) => {
  let obj = { foo: 'bar' }
  let id = 'foo'
  let op = ObjectOperation.Delete(id, 'bar')
  let expected = {}
  op.apply(obj)
  t.deepEqual(obj, expected)
  t.end()
})

test('Apply operation on PathObject.', (t) => {
  let myObj = new PathObject()
  let op = ObjectOperation.Set(['foo', 'bar'], null, 'bla')
  op.apply(myObj)
  t.equal(myObj.get(['foo', 'bar']), 'bla')
  t.end()
})

test('Creating operation with invalid data.', (t) => {
  t.throws(function () {
    new ObjectOperation()
  }, 'Should throw when data is undefined.')
  t.throws(function () {
    new ObjectOperation({})
  }, 'Should throw when type is missing.')
  t.throws(function () {
    new ObjectOperation({ type: 'foo', path: ['test'] })
  }, 'Should throw when type is invalid.')
  t.throws(function () {
    new ObjectOperation({
      type: ObjectOperation.CREATE
    })
  }, 'Should throw when path is missing.')
  t.throws(function () {
    new ObjectOperation({
      type: ObjectOperation.CREATE,
      path: ['test']
    })
  }, 'Should throw when created value is missing.')
  t.throws(function () {
    new ObjectOperation({
      type: ObjectOperation.UPDATE,
      path: ['test']
    })
  }, 'Should throw when update diff is missing.')
  t.throws(function () {
    new ObjectOperation({
      type: ObjectOperation.UPDATE,
      path: ['test'],
      diff: 'foo'
    })
  }, 'Should throw when update diff is invalid.')
  // we have relaxed that, so that it is possible to 'delete' a property by setting it to undefined
  // t.throws(function() {
  //   new ObjectOperation({
  //     type: ObjectOperation.SET,
  //     path: ["test"],
  //   })
  // }, "Should throw when value is missing.")
  // t.throws(function() {
  //   new ObjectOperation({
  //     type: ObjectOperation.SET,
  //     path: ["test"],
  //     val: 1
  //   })
  // }, "Should throw when old value is missing.")
  t.end()
})

test('Inverse of NOP is NOP', (t) => {
  let op = new ObjectOperation({type: ObjectOperation.NOP})
  let inverse = op.invert()
  t.ok(inverse.isNOP())
  t.end()
})

test('Inverse of Create is Delete and vice versa', (t) => {
  let op = ObjectOperation.Create('test', 'foo')
  let inverse = op.invert()
  t.ok(inverse.isDelete())
  t.equal(inverse.getValue(), 'foo')
  inverse = inverse.invert()
  t.ok(inverse.isCreate())
  t.equal(inverse.getValue(), 'foo')
  t.end()
})

test('Inverse of Update is Update', (t) => {
  let op = ObjectOperation.Update(['test', 'foo'], ArrayOperation.Insert(1, 'a'))
  let inverse = op.invert()
  t.ok(inverse.isUpdate())
  t.deepEqual(inverse.getPath(), ['test', 'foo'])
  t.ok(inverse.diff instanceof ArrayOperation)
  t.deepEqual(inverse.diff.toJSON(), op.diff.invert().toJSON())
  // same with a text operation as diff
  op = ObjectOperation.Update(['test', 'foo'], TextOperation.Insert(1, 'a'))
  inverse = op.invert()
  t.ok(inverse.diff instanceof TextOperation)
  t.deepEqual(inverse.diff.toJSON(), op.diff.invert().toJSON())
  t.end()
})

test('Inverse of Set is Set', (t) => {
  let op = ObjectOperation.Set(['test', 'foo'], 'foo', 'bar')
  let inverse = op.invert()
  t.ok(inverse.isSet())
  t.deepEqual(inverse.getPath(), ['test', 'foo'])
  t.equal(inverse.getValue(), 'foo')
  t.equal(inverse.original, 'bar')
  t.end()
})

test('Transformation: everything easy when not the same property', (t) => {
  let path1 = ['a']
  let path2 = ['b']
  let val1 = 'bla'
  let val2 = 'blupp'
  let a = ObjectOperation.Create(path1, val1)
  let b = ObjectOperation.Create(path2, val2)
  let ops = ObjectOperation.transform(a, b)
  t.deepEqual(ops[0].toJSON(), a.toJSON())
  t.deepEqual(ops[1].toJSON(), b.toJSON())
  t.end()
})

test('Transformation: everything easy when NOP involved', (t) => {
  let path1 = ['a']
  let val1 = 'bla'
  let a = ObjectOperation.Create(path1, val1)
  let b = new ObjectOperation({type: ObjectOperation.NOP})
  let ops = ObjectOperation.transform(a, b)
  t.deepEqual(ops[0].toJSON(), a.toJSON())
  t.deepEqual(ops[1].toJSON(), b.toJSON())
  t.end()
})

test('Transformation: creating the same value (unresolvable conflict)', (t) => {
  let path = ['a']
  let val1 = 'bla'
  let val2 = 'blupp'
  let a = ObjectOperation.Create(path, val1)
  let b = ObjectOperation.Create(path, val2)
  t.throws(function () {
    ObjectOperation.transform(a, b)
  })
  t.end()
})

test('Transformation: creating and updating the same value (unresolvable conflict)', (t) => {
  let path = ['a']
  let val1 = 'bla'
  let a = ObjectOperation.Create(path, val1)
  let b = ObjectOperation.Update(path, TextOperation.Insert(1, 'b'))
  t.throws(function () {
    ObjectOperation.transform(a, b)
  })
  t.end()
})

test('Transformation: creating and setting the same value (unresolvable conflict)', (t) => {
  let path = ['a']
  let val1 = 'bla'
  let val2 = 'blupp'
  let a = ObjectOperation.Create(path, val1)
  let b = ObjectOperation.Set(path, val1, val2)
  t.throws(function () {
    ObjectOperation.transform(a, b)
  })
  t.end()
})

test('Transformation: creating and deleting the same value (unresolvable conflict)', (t) => {
  let path = ['a']
  let val1 = 'bla'
  let a = ObjectOperation.Create(path, val1)
  let b = ObjectOperation.Delete(path, val1)
  t.throws(function () {
    ObjectOperation.transform(a, b)
  })
  t.end()
})

test('Transformation: deleting the same value', (t) => {
  let path = ['a']
  let val = 'bla'
  let input = {'a': val}
  let expected = {}
  let a = ObjectOperation.Delete(path, val)
  let b = ObjectOperation.Delete(path, val)
  checkObjectOperationTransform(t, a, b, input, expected)
  checkObjectOperationTransform(t, b, a, input, expected)
  t.end()
})

test('Transformation: deleting and updating the same value', (t) => {
  let path = ['a']
  let a = ObjectOperation.Delete(path, 'bla')
  let b = ObjectOperation.Update(path, TextOperation.Insert(3, 'pp'))
  let input = {a: 'bla'}
  let expected1 = {a: 'blapp'}
  let expected2 = {}
  checkObjectOperationTransform(t, a, b, input, expected1)
  checkObjectOperationTransform(t, b, a, input, expected2)
  // same with an array operation
  a = ObjectOperation.Delete(path, [1, 2, 3])
  b = ObjectOperation.Update(path, ArrayOperation.Insert(3, 4))
  input = {a: [1, 2, 3]}
  expected1 = {a: [1, 2, 3, 4]}
  expected2 = {}
  checkObjectOperationTransform(t, a, b, input, expected1)
  checkObjectOperationTransform(t, b, a, input, expected2)
  t.end()
})

test('Transformation: deleting and setting the same value', (t) => {
  let path = ['a']
  let a = ObjectOperation.Delete(path, 'bla')
  let b = ObjectOperation.Set(path, 'bla', 'blupp')
  let input = {a: 'bla'}
  let expected1 = {a: 'blupp'}
  let expected2 = {}
  checkObjectOperationTransform(t, a, b, input, expected1)
  checkObjectOperationTransform(t, b, a, input, expected2)
  t.end()
})

test('Transformation: updating the same value', (t) => {
  let path = ['a']
  let a = ObjectOperation.Update(path, TextOperation.Insert(3, 'pp'))
  let b = ObjectOperation.Update(path, TextOperation.Insert(3, 'ff'))
  let input = {a: 'bla'}
  let expected1 = {a: 'blappff'}
  let expected2 = {a: 'blaffpp'}
  checkObjectOperationTransform(t, a, b, input, expected1)
  checkObjectOperationTransform(t, b, a, input, expected2)
  // same with array updates
  a = ObjectOperation.Update(path, ArrayOperation.Insert(2, 3))
  b = ObjectOperation.Update(path, ArrayOperation.Insert(2, 4))
  input = {a: [1, 2, 5]}
  expected1 = {a: [1, 2, 3, 4, 5]}
  expected2 = {a: [1, 2, 4, 3, 5]}
  checkObjectOperationTransform(t, a, b, input, expected1)
  checkObjectOperationTransform(t, b, a, input, expected2)
  t.end()
})

test('Transformation: updating and setting the same value (unresolvable conflict)', (t) => {
  let path = ['a']
  let a = ObjectOperation.Update(path, TextOperation.Insert(3, 'ff'))
  let b = ObjectOperation.Set(path, 'bla', 'blupp')
  t.throws(function () {
    ObjectOperation.transform(a, b)
  })
  t.end()
})

test('Transformation: setting the same value', (t) => {
  let path = ['a']
  let a = ObjectOperation.Set(path, 'bla', 'blapp')
  let b = ObjectOperation.Set(path, 'bla', 'blupp')
  let input = {a: 'bla'}
  let expected1 = {a: 'blupp'}
  let expected2 = {a: 'blapp'}
  checkObjectOperationTransform(t, a, b, input, expected1)
  checkObjectOperationTransform(t, b, a, input, expected2)
  t.end()
})

test('ObjectOperation with the same path are conflicts.', (t) => {
  let a = ObjectOperation.Set(['bla', 'blupp'], null, 'foo')
  let b = ObjectOperation.Set(['bla', 'blupp'], null, 'bar')
  t.ok(a.hasConflict(b) && b.hasConflict(a))
  t.end()
})

test('NOPs have never conflicts.', (t) => {
  let a = ObjectOperation.Set(['bla', 'blupp'], null, 'foo')
  let b = new ObjectOperation({type: ObjectOperation.NOP})
  t.ok(!a.hasConflict(b) && !b.hasConflict(a))
  t.end()
})

test("With option 'no-conflict' conflicting operations can not be transformed.", (t) => {
  let a = ObjectOperation.Create('bla', 'blupp')
  let b = ObjectOperation.Create('bla', 'blupp')
  t.throws(function () {
    ObjectOperation.transform(a, b, { 'no-conflict': true })
  }, 'Transforming conflicting ops should throw when option "no-conflict" is enabled.')
  t.end()
})

test('JSON deserialisation', (t) => {
  let path = ['test', 'foo']

  let op = ObjectOperation.fromJSON({
    type: ObjectOperation.SET,
    path: path,
    val: 'bla',
    original: 'blupp'
  })
  t.equal(op.getType(), ObjectOperation.SET)
  t.equal(op.getValue(), 'bla')

  op = ObjectOperation.fromJSON({
    type: ObjectOperation.UPDATE,
    path: path,
    diff: ArrayOperation.Insert(1, 'a'),
    propertyType: 'array'
  })
  t.ok(op.diff instanceof ArrayOperation)
  t.deepEqual(op.getPath(), path)
  op = ObjectOperation.fromJSON({
    type: ObjectOperation.UPDATE,
    path: path,
    diff: TextOperation.Insert(1, 'a'),
    propertyType: 'string'
  })
  t.ok(op.diff instanceof TextOperation)
  t.deepEqual(op.getPath(), path)

  t.throws(function () {
    ObjectOperation.fromJSON({
      type: ObjectOperation.UPDATE,
      path: path,
      diff: 'bla',
      propertyType: 'foo'
    })
  }, 'Should throw for unknown update diff type.')
  t.end()
})

test('JSON serialisation', (t) => {
  let data = ObjectOperation.Create('test', 'bla').toJSON()
  t.equal(data.type, ObjectOperation.CREATE)
  t.equal(data.val, 'bla')
  data = ObjectOperation.Delete('test', 'bla').toJSON()
  t.equal(data.type, ObjectOperation.DELETE)
  t.equal(data.val, 'bla')
  data = ObjectOperation.Update(['test', 'foo'], ArrayOperation.Insert(1, 'a')).toJSON()
  t.equal(data.type, ObjectOperation.UPDATE)
  t.equal(data.propertyType, 'array')
  data = ObjectOperation.Update(['test', 'foo'], TextOperation.Insert(1, 'a')).toJSON()
  t.equal(data.propertyType, 'string')
  data = ObjectOperation.Set(['test', 'foo'], 'foo', 'bar').toJSON()
  t.equal(data.type, ObjectOperation.SET)
  t.equal(data.val, 'bar')
  t.equal(data.original, 'foo')
  t.end()
})
