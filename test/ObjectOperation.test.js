import { test } from 'substance-test'
import { ObjectOperation, ArrayOperation, TextOperation, PathObject, cloneDeep } from 'substance'

function checkObjectOperationTransform (test, a, b, input, expected) {
  const ops = ObjectOperation.transform(a.clone(), b.clone())
  let output = ops[1].apply(a.apply(cloneDeep(input)))
  test.deepEqual(output, expected, `(b' o a)('${JSON.stringify(input)}') == '${JSON.stringify(expected)}' with a=${a.toString()}, b'=${ops[1].toString()}`)
  output = ops[0].apply(b.apply(cloneDeep(input)))
  test.deepEqual(output, expected, `(a' o b)('${JSON.stringify(input)}') == '${JSON.stringify(expected)}' with b=${b.toString()}, a'=${ops[0].toString()}`)
}

test('ObjectOperation: Creating values.', t => {
  const path = ['a']
  const val = { bla: 'blupp' }
  const expected = { a: { bla: 'blupp' } }
  const op = ObjectOperation.Create(path, val)
  const obj = {}
  op.apply(obj)
  t.deepEqual(obj, expected, 'Should create value.')
  t.end()
})

test('ObjectOperation: Creating nested values.', t => {
  const path = ['a', 'b']
  const val = { bla: 'blupp' }
  const expected = { a: { b: { bla: 'blupp' } } }
  const op = ObjectOperation.Create(path, val)
  const obj = { a: {} }
  op.apply(obj)
  t.deepEqual(obj, expected, 'Should create nested value.')
  t.end()
})

test('ObjectOperation: Deleting values.', t => {
  const path = ['a']
  const val = 'bla'
  const op = ObjectOperation.Delete(path, val)
  const expected = {}
  const obj = { a: 'bla' }
  op.apply(obj)
  t.deepEqual(obj, expected, 'Should delete value.')
  t.end()
})

test('ObjectOperation: Deleting nested values.', t => {
  const path = ['a', 'b']
  const val = 'bla'
  const op = ObjectOperation.Delete(path, val)
  const expected = { a: {} }
  const obj = { a: { b: 'bla' } }
  op.apply(obj)
  t.deepEqual(obj, expected, 'Should delete nested value.')
  t.end()
})

test('ObjectOperation: Updating a text property.', t => {
  const obj = { a: 'bla' }
  const path = ['a']
  const op1 = ObjectOperation.Update(path, TextOperation.Delete(2, 'a'))
  const op2 = ObjectOperation.Update(path, TextOperation.Insert(2, 'upp'))
  const expected = { a: 'blupp' }
  op1.apply(obj)
  op2.apply(obj)
  t.deepEqual(obj, expected)
  t.end()
})

test('ObjectOperation: Updating an array property.', t => {
  const obj = { a: [1, 2, 3, 4, 5] }
  const path = ['a']
  const op1 = ObjectOperation.Update(path, ArrayOperation.Delete(2, 3))
  const op2 = ObjectOperation.Update(path, ArrayOperation.Insert(4, 6))
  const expected = { a: [1, 2, 4, 5, 6] }
  op1.apply(obj)
  op2.apply(obj)
  t.deepEqual(obj, expected)
  t.end()
})

test('ObjectOperation: Creating an update operation with invalid diff.', t => {
  t.throws(function () {
    ObjectOperation.Update(['test'], 'foo')
  }, 'Should throw.')
  t.end()
})

test('ObjectOperation: Creating a top-level property using id.', t => {
  const obj = {}
  const id = 'foo'
  const op = ObjectOperation.Create(id, 'bar')
  const expected = { foo: 'bar' }
  op.apply(obj)
  t.deepEqual(obj, expected)
  t.end()
})

test('ObjectOperation: Deleting a top-level property using id.', t => {
  const obj = { foo: 'bar' }
  const id = 'foo'
  const op = ObjectOperation.Delete(id, 'bar')
  const expected = {}
  op.apply(obj)
  t.deepEqual(obj, expected)
  t.end()
})

test('ObjectOperation: Apply operation on PathObject.', t => {
  const myObj = new PathObject()
  const op = ObjectOperation.Set(['foo', 'bar'], null, 'bla')
  op.apply(myObj)
  t.equal(myObj.get(['foo', 'bar']), 'bla')
  t.end()
})

test('ObjectOperation: Creating operation with invalid data.', t => {
  t.throws(function () {
    new ObjectOperation() // eslint-disable-line no-new
  }, 'Should throw when data is undefined.')
  t.throws(function () {
    new ObjectOperation({}) // eslint-disable-line no-new
  }, 'Should throw when type is missing.')
  t.throws(function () {
    new ObjectOperation({ type: 'foo', path: ['test'] }) // eslint-disable-line no-new
  }, 'Should throw when type is invalid.')
  t.throws(function () {
    new ObjectOperation({ // eslint-disable-line no-new
      type: ObjectOperation.CREATE
    })
  }, 'Should throw when path is missing.')
  t.throws(function () {
    new ObjectOperation({ // eslint-disable-line no-new
      type: ObjectOperation.CREATE,
      path: ['test']
    })
  }, 'Should throw when created value is missing.')
  t.throws(function () {
    new ObjectOperation({ // eslint-disable-line no-new
      type: ObjectOperation.UPDATE,
      path: ['test']
    })
  }, 'Should throw when update diff is missing.')
  t.throws(function () {
    new ObjectOperation({ // eslint-disable-line no-new
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

test('ObjectOperation: Inverse of NOP is NOP', t => {
  const op = new ObjectOperation({ type: ObjectOperation.NOP })
  const inverse = op.invert()
  t.ok(inverse.isNOP())
  t.end()
})

test('ObjectOperation: Inverse of Create is Delete and vice versa', t => {
  const op = ObjectOperation.Create('test', 'foo')
  let inverse = op.invert()
  t.ok(inverse.isDelete())
  t.equal(inverse.getValue(), 'foo')
  inverse = inverse.invert()
  t.ok(inverse.isCreate())
  t.equal(inverse.getValue(), 'foo')
  t.end()
})

test('ObjectOperation: Inverse of Update is Update', t => {
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

test('ObjectOperation: Inverse of Set is Set', t => {
  const op = ObjectOperation.Set(['test', 'foo'], 'foo', 'bar')
  const inverse = op.invert()
  t.ok(inverse.isSet())
  t.deepEqual(inverse.getPath(), ['test', 'foo'])
  t.equal(inverse.getValue(), 'foo')
  t.equal(inverse.original, 'bar')
  t.end()
})

test('ObjectOperation: Transformation: everything easy when not the same property', t => {
  const path1 = ['a']
  const path2 = ['b']
  const val1 = 'bla'
  const val2 = 'blupp'
  const a = ObjectOperation.Create(path1, val1)
  const b = ObjectOperation.Create(path2, val2)
  const ops = ObjectOperation.transform(a, b)
  t.deepEqual(ops[0].toJSON(), a.toJSON())
  t.deepEqual(ops[1].toJSON(), b.toJSON())
  t.end()
})

test('ObjectOperation: Transformation: everything easy when NOP involved', t => {
  const path1 = ['a']
  const val1 = 'bla'
  const a = ObjectOperation.Create(path1, val1)
  const b = new ObjectOperation({ type: ObjectOperation.NOP })
  const ops = ObjectOperation.transform(a, b)
  t.deepEqual(ops[0].toJSON(), a.toJSON())
  t.deepEqual(ops[1].toJSON(), b.toJSON())
  t.end()
})

test('ObjectOperation: Transformation: creating the same value (unresolvable conflict)', t => {
  const path = ['a']
  const val1 = 'bla'
  const val2 = 'blupp'
  const a = ObjectOperation.Create(path, val1)
  const b = ObjectOperation.Create(path, val2)
  t.throws(function () {
    ObjectOperation.transform(a, b)
  })
  t.end()
})

test('ObjectOperation: Transformation: creating and updating the same value (unresolvable conflict)', t => {
  const path = ['a']
  const val1 = 'bla'
  const a = ObjectOperation.Create(path, val1)
  const b = ObjectOperation.Update(path, TextOperation.Insert(1, 'b'))
  t.throws(function () {
    ObjectOperation.transform(a, b)
  })
  t.end()
})

test('ObjectOperation: Transformation: creating and setting the same value (unresolvable conflict)', t => {
  const path = ['a']
  const val1 = 'bla'
  const val2 = 'blupp'
  const a = ObjectOperation.Create(path, val1)
  const b = ObjectOperation.Set(path, val1, val2)
  t.throws(function () {
    ObjectOperation.transform(a, b)
  })
  t.end()
})

test('ObjectOperation: Transformation: creating and deleting the same value (unresolvable conflict)', t => {
  const path = ['a']
  const val1 = 'bla'
  const a = ObjectOperation.Create(path, val1)
  const b = ObjectOperation.Delete(path, val1)
  t.throws(function () {
    ObjectOperation.transform(a, b)
  })
  t.end()
})

test('ObjectOperation: Transformation: deleting the same value', t => {
  const path = ['a']
  const val = 'bla'
  const input = { a: val }
  const expected = {}
  const a = ObjectOperation.Delete(path, val)
  const b = ObjectOperation.Delete(path, val)
  checkObjectOperationTransform(t, a, b, input, expected)
  checkObjectOperationTransform(t, b, a, input, expected)
  t.end()
})

test('ObjectOperation: Transformation: deleting and updating the same value', t => {
  const path = ['a']
  let a = ObjectOperation.Delete(path, 'bla')
  let b = ObjectOperation.Update(path, TextOperation.Insert(3, 'pp'))
  let input = { a: 'bla' }
  let expected1 = { a: 'blapp' }
  let expected2 = {}
  checkObjectOperationTransform(t, a, b, input, expected1)
  checkObjectOperationTransform(t, b, a, input, expected2)
  // same with an array operation
  a = ObjectOperation.Delete(path, [1, 2, 3])
  b = ObjectOperation.Update(path, ArrayOperation.Insert(3, 4))
  input = { a: [1, 2, 3] }
  expected1 = { a: [1, 2, 3, 4] }
  expected2 = {}
  checkObjectOperationTransform(t, a, b, input, expected1)
  checkObjectOperationTransform(t, b, a, input, expected2)
  t.end()
})

test('ObjectOperation: Transformation: deleting and setting the same value', t => {
  const path = ['a']
  const a = ObjectOperation.Delete(path, 'bla')
  const b = ObjectOperation.Set(path, 'bla', 'blupp')
  const input = { a: 'bla' }
  const expected1 = { a: 'blupp' }
  const expected2 = {}
  checkObjectOperationTransform(t, a, b, input, expected1)
  checkObjectOperationTransform(t, b, a, input, expected2)
  t.end()
})

test('ObjectOperation: Transformation: updating the same value', t => {
  const path = ['a']
  let a = ObjectOperation.Update(path, TextOperation.Insert(3, 'pp'))
  let b = ObjectOperation.Update(path, TextOperation.Insert(3, 'ff'))
  let input = { a: 'bla' }
  let expected1 = { a: 'blappff' }
  let expected2 = { a: 'blaffpp' }
  checkObjectOperationTransform(t, a, b, input, expected1)
  checkObjectOperationTransform(t, b, a, input, expected2)
  // same with array updates
  a = ObjectOperation.Update(path, ArrayOperation.Insert(2, 3))
  b = ObjectOperation.Update(path, ArrayOperation.Insert(2, 4))
  input = { a: [1, 2, 5] }
  expected1 = { a: [1, 2, 3, 4, 5] }
  expected2 = { a: [1, 2, 4, 3, 5] }
  checkObjectOperationTransform(t, a, b, input, expected1)
  checkObjectOperationTransform(t, b, a, input, expected2)
  t.end()
})

test('ObjectOperation: Transformation: updating and setting the same value (unresolvable conflict)', t => {
  const path = ['a']
  const a = ObjectOperation.Update(path, TextOperation.Insert(3, 'ff'))
  const b = ObjectOperation.Set(path, 'bla', 'blupp')
  t.throws(function () {
    ObjectOperation.transform(a, b)
  })
  t.end()
})

test('ObjectOperation: Transformation: setting the same value', t => {
  const path = ['a']
  const a = ObjectOperation.Set(path, 'bla', 'blapp')
  const b = ObjectOperation.Set(path, 'bla', 'blupp')
  const input = { a: 'bla' }
  const expected1 = { a: 'blupp' }
  const expected2 = { a: 'blapp' }
  checkObjectOperationTransform(t, a, b, input, expected1)
  checkObjectOperationTransform(t, b, a, input, expected2)
  t.end()
})

test('ObjectOperation: ObjectOperation with the same path are conflicts.', t => {
  const a = ObjectOperation.Set(['bla', 'blupp'], null, 'foo')
  const b = ObjectOperation.Set(['bla', 'blupp'], null, 'bar')
  t.ok(a.hasConflict(b) && b.hasConflict(a))
  t.end()
})

test('ObjectOperation: NOPs have never conflicts.', t => {
  const a = ObjectOperation.Set(['bla', 'blupp'], null, 'foo')
  const b = new ObjectOperation({ type: ObjectOperation.NOP })
  t.ok(!a.hasConflict(b) && !b.hasConflict(a))
  t.end()
})

test("ObjectOperation: With option 'no-conflict' conflicting operations can not be transformed.", t => {
  const a = ObjectOperation.Create('bla', 'blupp')
  const b = ObjectOperation.Create('bla', 'blupp')
  t.throws(function () {
    ObjectOperation.transform(a, b, { 'no-conflict': true })
  }, 'Transforming conflicting ops should throw when option "no-conflict" is enabled.')
  t.end()
})

test('ObjectOperation: JSON deserialisation', t => {
  const path = ['test', 'foo']

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

test('ObjectOperation: JSON serialisation', t => {
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
