import { module } from 'substance-test'
import { ArrayOperation } from 'substance'

const test = module('ArrayOperation')

function checkArrayOperationTransform (t, a, b, input, expected) {
  let ops = ArrayOperation.transform(a, b)
  let output = ops[1].apply(a.apply(input.slice(0)))
  t.deepEqual(output, expected, `(b' o a)('${JSON.stringify(input)}') == '${JSON.stringify(expected)}' with a=${a.toString()}, b'=${ops[1].toString()}`)
  output = ops[0].apply(b.apply(input.slice(0)))
  t.deepEqual(output, expected, `(a' o b)('${JSON.stringify(input)}') == '${JSON.stringify(expected)}' with b=${b.toString()}, a'=${ops[0].toString()}`)
}

test('Insert element', (t) => {
  let arr = [1, 2, 4]
  let expected = [1, 2, 3, 4]
  let op = ArrayOperation.Insert(2, 3)
  op.apply(arr)
  t.deepEqual(arr, expected, 'Should insert element.')
  t.end()
})

test('Insert element after last position', (t) => {
  let arr = [1, 2, 3]
  let expected = [1, 2, 3, 4]
  let op = ArrayOperation.Insert(arr.length, 4)
  op.apply(arr)
  t.deepEqual(arr, expected, 'Should append element.')
  t.end()
})

test('Delete element', (t) => {
  let arr = [1, 2, 3]
  let expected = [1, 3]
  let op = ArrayOperation.Delete(1, 2)
  op.apply(arr)
  t.deepEqual(arr, expected, 'Should delete element.')
  t.end()
})

test('Create operation with invalid data', (t) => {
  t.throws(function () {
    new ArrayOperation()
  }, 'Should throw if no data given.')
  t.throws(function () {
    new ArrayOperation({ type: 'foo' })
  }, 'Should throw for invalid type.')
  t.throws(function () {
    new ArrayOperation({ type: ArrayOperation.INSERT, value: 1})
  }, 'Should throw for missing position.')
  t.throws(function () {
    new ArrayOperation({ type: ArrayOperation.INSERT, pos: -1, value: 1})
  }, 'Should throw for position < 0.')
  t.end()
})

test('Operation can be NOP', (t) => {
  let op = new ArrayOperation({type: ArrayOperation.NOP})
  t.ok(op.isNOP(), 'Operation should be NOP')
  t.end()
})

test('Apply operation on too short array.', (t) => {
  let arr = [1, 2, 3]
  let op = ArrayOperation.Insert(4, 5)
  t.throws(function () {
    op.apply(arr)
  }, 'Should throw if applying insert operation out-of-bounds')
  op = ArrayOperation.Delete(4, 5)
  t.throws(function () {
    op.apply(arr)
  }, 'Should throw if applying delete operation out-of-bounds')
  t.end()
})

// Note: it is better to fail in such cases, as this is an indicator for other greater problems.
test('Apply delete operation on wrong array.', (t) => {
  let arr = [1, 2, 3]
  let op = ArrayOperation.Delete(2, 4)
  t.throws(function () {
    op.apply(arr)
  }, 'Should throw if applying delete operation with wrong value')
  t.end()
})

test('JSON de-/serialisation', (t) => {
  let op = ArrayOperation.Delete(1, 2)
  let out = op.toJSON()
  t.equal(out.type, ArrayOperation.DELETE)
  t.equal(out.pos, 1)
  t.equal(out.val, 2)
  op = ArrayOperation.fromJSON(out)
  t.ok(op.isDelete())
  t.equal(op.getOffset(), 1)
  t.equal(op.getValue(), 2)
  op = new ArrayOperation({type: ArrayOperation.NOP})
  out = op.toJSON()
  t.deepEqual(out, {type: ArrayOperation.NOP})
  t.end()
})

// Insert-Insert Transformations
// --------
// Cases:
//  1. `a < b`:   operations should not be affected
//  2. `b < a`:   dito
//  3. `a == b`:  result depends on preference (first applied)

test('Transformation: a=Insert, b=Insert, a < b and b < a', (t) => {
  let input = [1, 3, 5]
  let expected = [1, 2, 3, 4, 5]
  let a = ArrayOperation.Insert(1, 2)
  let b = ArrayOperation.Insert(2, 4)
  checkArrayOperationTransform(t, a, b, input, expected)
  checkArrayOperationTransform(t, b, a, input, expected)
  t.end()
})

// Example:
//     A = [1,4], a = [+, 1, 2], b = [+, 1, 3]
//     A  - a ->  [1, 2, 4]   - b' ->   [1,2,3,4]     => b'= [+, 2, 3], transform(a, b) = [a, b']
//     A  - b ->  [1, 3, 4]   - a' ->   [1,3,2,4]     => a'= [+, 2, 2], transform(b, a) = [a', b]
test('Transformation: a=Insert, b=Insert, a == b', (t) => {
  let input = [1, 4]
  let expected = [1, 2, 3, 4]
  let expected_2 = [1, 3, 2, 4]
  let a = ArrayOperation.Insert(1, 2)
  let b = ArrayOperation.Insert(1, 3)
  checkArrayOperationTransform(t, a, b, input, expected)
  checkArrayOperationTransform(t, b, a, input, expected_2)
  t.end()
})

// Delete-Delete Transformations
// --------
// Cases:
//  1. `a < b`:   operations should not be affected
//  2. `b < a`:   dito
//  3. `a == b`:  second operation should not have an effect
//                user should be noticed about conflict

test('Transformation: a=Delete, b=Delete (1,2), a < b and b < a', (t) => {
  let input = [1, 2, 3, 4, 5]
  let expected = [1, 3, 5]
  let a = ArrayOperation.Delete(1, 2)
  let b = ArrayOperation.Delete(3, 4)
  checkArrayOperationTransform(t, a, b, input, expected)
  checkArrayOperationTransform(t, b, a, input, expected)
  t.end()
})

test('Transformation: a=Delete, b=Delete (3), a == b', (t) => {
  let input = [1, 2, 3]
  let expected = [1, 3]
  let a = ArrayOperation.Delete(1, 2)
  let b = ArrayOperation.Delete(1, 2)
  checkArrayOperationTransform(t, a, b, input, expected)
  checkArrayOperationTransform(t, b, a, input, expected)
  t.end()
})

// Insert-Delete Transformations
// --------
// Cases: (a = insertion, b = deletion)
//  1. `a < b`:   b must be shifted right
//  2. `b < a`:   a must be shifted left
//  3. `a == b`:  ???

// A = [1,3,4,5], a = [+, 1, 2], b = [-, 2, 4]
// A  - a ->  [1,2,3,4,5] - b' ->   [1,2,3,5]     => b'= [-, 3, 4]
// A  - b ->  [1,3,5]     - a' ->   [1,2,3,5]     => a'= [+, 1, 2] = a
test('Transformation: a=Insert, b=Delete (1), a < b', (t) => {
  let input = [1, 3, 4, 5]
  let expected = [1, 2, 3, 5]
  let a = ArrayOperation.Insert(1, 2)
  let b = ArrayOperation.Delete(2, 4)
  checkArrayOperationTransform(t, a, b, input, expected)
  checkArrayOperationTransform(t, b, a, input, expected)
  t.end()
})

// A = [1,2,3,5], a = [+,3,4], b = [-,1,2]
// A  - a ->  [1,2,3,4,5] - b' ->   [1,3,4,5]     => b'= [-,1,2] = b
// A  - b ->  [1,3,5]     - a' ->   [1,3,4,5]     => a'= [+,2,4]
test('Transformation: a=Insert, b=Delete (2), b < a', (t) => {
  let input = [1, 2, 3, 5]
  let expected = [1, 3, 4, 5]
  let a = ArrayOperation.Insert(3, 4)
  let b = ArrayOperation.Delete(1, 2)
  checkArrayOperationTransform(t, a, b, input, expected)
  checkArrayOperationTransform(t, b, a, input, expected)
  t.end()
})

// A = [1,2,3], a = [+,1,4], b = [-,1,2]
// A  - a ->  [1,4,2,3] - b' ->   [1,4,3]     => b'= [-,2,2]
// A  - b ->  [1,3]     - a' ->   [1,4,3]     => a'= [+,1,4] = a
test('Transformation: a=Insert, b=Delete (3), a == b', (t) => {
  let input = [1, 2, 3]
  let expected = [1, 4, 3]
  let a = ArrayOperation.Insert(1, 4)
  let b = ArrayOperation.Delete(1, 2)
  checkArrayOperationTransform(t, a, b, input, expected)
  checkArrayOperationTransform(t, b, a, input, expected)
  t.end()
})

test('Transformation: a=NOP || b=NOP', (t) => {
  let a = new ArrayOperation.Insert(1, 4)
  let b = new ArrayOperation({type: ArrayOperation.NOP})
  let tr = ArrayOperation.transform(a, b)
  t.deepEqual(tr[0].toJSON(), a.toJSON())
  t.deepEqual(tr[1].toJSON(), b.toJSON())
  tr = ArrayOperation.transform(b, a)
  t.deepEqual(tr[0].toJSON(), b.toJSON())
  t.deepEqual(tr[1].toJSON(), a.toJSON())
  t.end()
})

test('Inverting operations', (t) => {
  let op = ArrayOperation.Insert(1, 4)
  let inverse = op.invert()
  t.ok(inverse.isDelete(), 'Inverse of an insert op should be a delete op.')
  t.equal(inverse.getOffset(), op.getOffset(), 'Offset of inverted op should be the same.')
  t.equal(inverse.getValue(), op.getValue(), 'Value of inverted op should be the same.')
  op = ArrayOperation.Delete(2, 3)
  inverse = op.invert()
  t.ok(inverse.isInsert(), 'Inverse of a delete op should be an insert op.')
  t.equal(inverse.getOffset(), op.getOffset(), 'Offset of inverted op should be the same.')
  t.equal(inverse.getValue(), op.getValue(), 'Value of inverted op should be the same.')
  op = new ArrayOperation({type: ArrayOperation.NOP})
  inverse = op.invert()
  t.ok(inverse.isNOP(), 'Inverse of a nop is a nop.')
  t.end()
})

test('Transformations can be done inplace (optimzation for internal use)', (t) => {
  let a = ArrayOperation.Insert(2, 3)
  let b = ArrayOperation.Insert(2, 3)
  let tr = ArrayOperation.transform(a, b, {inplace: true})
  t.ok(a.getOffset() === tr[0].getOffset() && b.getOffset() === tr[1].getOffset(), 'Transformation should be done inplace.')
  t.end()
})

test("With option 'no-conflict' conflicting operations can not be transformed.", (t) => {
  let a = ArrayOperation.Insert(2, 2)
  let b = ArrayOperation.Insert(2, 2)
  t.throws(function () {
    ArrayOperation.transform(a, b, { 'no-conflict': true })
  }, 'Transforming conflicting ops should throw when option "no-conflict" is enabled.')
  t.end()
})

test('Conflicts: inserting at the same position', (t) => {
  // this is considered a conflict as a decision is needed to determine which element comes first.
  let a = ArrayOperation.Insert(2, 'a')
  let b = ArrayOperation.Insert(2, 'b')
  t.ok(a.hasConflict(b) && b.hasConflict(a), 'Inserts at the same position are considered a conflict.')
  t.end()
})

test('Conflicts: inserting at different positions', (t) => {
  let a = ArrayOperation.Insert(2, 'a')
  let b = ArrayOperation.Insert(4, 'b')
  t.ok(!a.hasConflict(b) && !b.hasConflict(a), 'Inserts at different positions should be fine.')
  t.end()
})

test('Conflicts: deleting at the same position', (t) => {
  // this is *not* considered a conflict as it is clear how the result should look like.
  let a = ArrayOperation.Delete(2, 'a')
  let b = ArrayOperation.Delete(2, 'a')
  t.ok(!a.hasConflict(b) && !b.hasConflict(a), 'Deletes at the same position are not a conflict.')
  t.end()
})

test('Conflicts: inserting and deleting at the same position', (t) => {
  // this is *not* considered a conflict as it is clear how the result should look like.
  let a = ArrayOperation.Insert(2, 'a')
  let b = ArrayOperation.Delete(2, 'b')
  t.ok(!a.hasConflict(b) && !b.hasConflict(a), 'Inserting and deleting at the same position is not a conflict.')
  t.end()
})

test('Conflicts: when NOP involved', (t) => {
  let a = ArrayOperation.Insert(2, 2)
  let b = new ArrayOperation({type: ArrayOperation.NOP})
  t.ok(!a.hasConflict(b) && !b.hasConflict(a), 'NOPs should never conflict.')
  t.end()
})
