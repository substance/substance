"use strict";

require('../QUnitExtensions');
var isEqual = require('lodash/isEqual');
var ArrayOperation = require('../../model/data/ArrayOperation');

QUnit.module('model/data/ArrayOperation');

QUnit.assert.checkArrayOperationTransform = function(a, b, input, expected) {
  var t = ArrayOperation.transform(a, b);
  var output = t[1].apply(a.apply(input.slice(0)));
  this.push(isEqual(expected, output), output, expected, "(b' o a)('"+JSON.stringify(input)+"') == '" + JSON.stringify(expected) + "' with a="+a.toString()+", b'="+t[1].toString());
  output = t[0].apply(b.apply(input.slice(0)));
  this.push(isEqual(expected, output), output, expected, "(a' o b)('"+JSON.stringify(input)+"') == '" + JSON.stringify(expected) + "' with b="+b.toString()+", a'="+t[0].toString());
};

QUnit.test("Insert element", function(assert) {
  var arr = [1,2,4];
  var expected = [1,2,3,4];
  var op = ArrayOperation.Insert(2, 3);
  op.apply(arr);
  assert.deepEqual(arr, expected, 'Should insert element.');
});

QUnit.test("Insert element after last position", function(assert) {
  var arr = [1,2,3];
  var expected = [1,2,3,4];
  var op = ArrayOperation.Insert(arr.length, 4);
  op.apply(arr);
  assert.deepEqual(arr, expected, 'Should append element.');
});

QUnit.test("Delete element", function(assert) {
  var arr = [1,2,3];
  var expected = [1,3];
  var op = ArrayOperation.Delete(1, 2);
  op.apply(arr);
  assert.deepEqual(arr, expected, 'Should delete element.');
});

QUnit.test("Create operation with invalid data", function(assert) {
  assert.throws(function() {
    new ArrayOperation();
  }, "Should throw if no data given.");
  assert.throws(function() {
    new ArrayOperation({ type: 'foo' });
  }, "Should throw for invalid type.");
  assert.throws(function() {
    new ArrayOperation({ type: ArrayOperation.INSERT, value: 1});
  }, "Should throw for missing position.");
  assert.throws(function() {
    new ArrayOperation({ type: ArrayOperation.INSERT, pos: -1, value: 1});
  }, "Should throw for position < 0.");
});

QUnit.test("Operation can be NOP", function(assert) {
  var op = new ArrayOperation({type: ArrayOperation.NOP});
  assert.ok(op.isNOP(), 'Operation should be NOP');
});

QUnit.test("Apply operation on too short array.", function(assert) {
  var arr = [1,2,3];
  var op = ArrayOperation.Insert(4, 5);
  assert.throws(function() {
    op.apply(arr);
  }, "Should throw if applying insert operation out-of-bounds");
  op = ArrayOperation.Delete(4, 5);
  assert.throws(function() {
    op.apply(arr);
  }, "Should throw if applying delete operation out-of-bounds");
});

// Note: it is better to fail in such cases, as this is an indicator for other greater problems.
QUnit.test("Apply delete operation on wrong array.", function(assert) {
  var arr = [1,2,3];
  var op = ArrayOperation.Delete(2, 4);
  assert.throws(function() {
    op.apply(arr);
  }, "Should throw if applying delete operation with wrong value");
});

QUnit.test("JSON de-/serialisation", function(assert) {
  var op = ArrayOperation.Delete(1,2);
  var out = op.toJSON();
  assert.equal(out.type, ArrayOperation.DELETE);
  assert.equal(out.pos, 1);
  assert.equal(out.val, 2);
  op = ArrayOperation.fromJSON(out);
  assert.ok(op.isDelete());
  assert.equal(op.getOffset(), 1);
  assert.equal(op.getValue(), 2);
  op = new ArrayOperation({type: ArrayOperation.NOP});
  out = op.toJSON();
  assert.deepEqual(out, {type: ArrayOperation.NOP});
});

// Insert-Insert Transformations
// --------
// Cases:
//  1. `a < b`:   operations should not be affected
//  2. `b < a`:   dito
//  3. `a == b`:  result depends on preference (first applied)

QUnit.test("Transformation: a=Insert, b=Insert, a < b and b < a", function(assert) {
  var input = [1,3,5];
  var expected = [1,2,3,4,5];
  var a = ArrayOperation.Insert(1, 2);
  var b = ArrayOperation.Insert(2, 4);
  assert.checkArrayOperationTransform(a, b, input, expected);
  assert.checkArrayOperationTransform(b, a, input, expected);
});

// Example:
//     A = [1,4], a = [+, 1, 2], b = [+, 1, 3]
//     A  - a ->  [1, 2, 4]   - b' ->   [1,2,3,4]     => b'= [+, 2, 3], transform(a, b) = [a, b']
//     A  - b ->  [1, 3, 4]   - a' ->   [1,3,2,4]     => a'= [+, 2, 2], transform(b, a) = [a', b]
QUnit.test("Transformation: a=Insert, b=Insert, a == b", function(assert) {
  var input = [1,4];
  var expected = [1,2,3,4];
  var expected_2 = [1,3,2,4];
  var a = ArrayOperation.Insert(1, 2);
  var b = ArrayOperation.Insert(1, 3);
  assert.checkArrayOperationTransform(a, b, input, expected);
  assert.checkArrayOperationTransform(b, a, input, expected_2);
});

// Delete-Delete Transformations
// --------
// Cases:
//  1. `a < b`:   operations should not be affected
//  2. `b < a`:   dito
//  3. `a == b`:  second operation should not have an effect;
//                user should be noticed about conflict

QUnit.test("Transformation: a=Delete, b=Delete (1,2), a < b and b < a", function(assert) {
  var input = [1,2,3,4,5];
  var expected = [1,3,5];
  var a = ArrayOperation.Delete(1, 2);
  var b = ArrayOperation.Delete(3, 4);
  assert.checkArrayOperationTransform(a, b, input, expected);
  assert.checkArrayOperationTransform(b, a, input, expected);
});


QUnit.test("Transformation: a=Delete, b=Delete (3), a == b", function(assert) {
  var input = [1,2,3];
  var expected = [1,3];
  var a = ArrayOperation.Delete(1, 2);
  var b = ArrayOperation.Delete(1, 2);
  assert.checkArrayOperationTransform(a, b, input, expected);
  assert.checkArrayOperationTransform(b, a, input, expected);
});


// Insert-Delete Transformations
// --------
// Cases: (a = insertion, b = deletion)
//  1. `a < b`:   b must be shifted right
//  2. `b < a`:   a must be shifted left
//  3. `a == b`:  ???


// A = [1,3,4,5], a = [+, 1, 2], b = [-, 2, 4]
// A  - a ->  [1,2,3,4,5] - b' ->   [1,2,3,5]     => b'= [-, 3, 4]
// A  - b ->  [1,3,5]     - a' ->   [1,2,3,5]     => a'= [+, 1, 2] = a
QUnit.test("Transformation: a=Insert, b=Delete (1), a < b", function(assert) {
  var input = [1,3,4,5];
  var expected = [1,2,3,5];
  var a = ArrayOperation.Insert(1, 2);
  var b = ArrayOperation.Delete(2, 4);
  assert.checkArrayOperationTransform(a, b, input, expected);
  assert.checkArrayOperationTransform(b, a, input, expected);
});


// A = [1,2,3,5], a = [+,3,4], b = [-,1,2]
// A  - a ->  [1,2,3,4,5] - b' ->   [1,3,4,5]     => b'= [-,1,2] = b
// A  - b ->  [1,3,5]     - a' ->   [1,3,4,5]     => a'= [+,2,4]
QUnit.test("Transformation: a=Insert, b=Delete (2), b < a", function(assert) {
  var input = [1,2,3,5];
  var expected = [1,3,4,5];
  var a = ArrayOperation.Insert(3, 4);
  var b = ArrayOperation.Delete(1, 2);
  assert.checkArrayOperationTransform(a, b, input, expected);
  assert.checkArrayOperationTransform(b, a, input, expected);
});


// A = [1,2,3], a = [+,1,4], b = [-,1,2]
// A  - a ->  [1,4,2,3] - b' ->   [1,4,3]     => b'= [-,2,2]
// A  - b ->  [1,3]     - a' ->   [1,4,3]     => a'= [+,1,4] = a
QUnit.test("Transformation: a=Insert, b=Delete (3), a == b", function(assert) {
  var input = [1,2,3];
  var expected = [1,4,3];
  var a = ArrayOperation.Insert(1, 4);
  var b = ArrayOperation.Delete(1, 2);
  assert.checkArrayOperationTransform(a, b, input, expected);
  assert.checkArrayOperationTransform(b, a, input, expected);
});

QUnit.test("Transformation: a=NOP || b=NOP", function(assert) {
  // var input = [1,2,3];
  var a = new ArrayOperation.Insert(1, 4);
  var b = new ArrayOperation({type: ArrayOperation.NOP});
  var t = ArrayOperation.transform(a, b);
  assert.deepEqual(t[0].toJSON(), a.toJSON());
  assert.deepEqual(t[1].toJSON(), b.toJSON());
  t = ArrayOperation.transform(b, a);
  assert.deepEqual(t[0].toJSON(), b.toJSON());
  assert.deepEqual(t[1].toJSON(), a.toJSON());
});


QUnit.test("Inverting operations", function(assert) {
  var op = ArrayOperation.Insert(1, 4);
  var inverse = op.invert();
  assert.ok(inverse.isDelete(), 'Inverse of an insert op should be a delete op.');
  assert.equal(inverse.getOffset(), op.getOffset(), 'Offset of inverted op should be the same.');
  assert.equal(inverse.getValue(), op.getValue(), 'Value of inverted op should be the same.');
  op = ArrayOperation.Delete(2, 3);
  inverse = op.invert();
  assert.ok(inverse.isInsert(), 'Inverse of a delete op should be an insert op.');
  assert.equal(inverse.getOffset(), op.getOffset(), 'Offset of inverted op should be the same.');
  assert.equal(inverse.getValue(), op.getValue(), 'Value of inverted op should be the same.');
  op = new ArrayOperation({type: ArrayOperation.NOP});
  inverse = op.invert();
  assert.ok(inverse.isNOP(), 'Inverse of a nop is a nop.');
});

QUnit.test("Transformations can be done inplace (optimzation for internal use)", function(assert) {
  // var input = "Lorem ipsum";
  var a = ArrayOperation.Insert(2, 3);
  var b = ArrayOperation.Insert(2, 3);
  var t = ArrayOperation.transform(a, b, {inplace: true});
  assert.ok(a.getOffset() === t[0].getOffset() && b.getOffset() === t[1].getOffset(), "Transformation should be done inplace.");
});

QUnit.test("With option 'no-conflict' conflicting operations can not be transformed.", function(assert) {
  var a = ArrayOperation.Insert(2, 2);
  var b = ArrayOperation.Insert(2, 2);
  assert.throws(function() {
    ArrayOperation.transform(a, b, { "no-conflict": true });
  }, 'Transforming conflicting ops should throw when option "no-conflict" is enabled.');
});

QUnit.test("Conflicts: inserting at the same position", function(assert) {
  // this is considered a conflict as a decision is needed to determine which element comes first.
  var a = ArrayOperation.Insert(2, 'a');
  var b = ArrayOperation.Insert(2, 'b');
  assert.ok(a.hasConflict(b) && b.hasConflict(a), "Inserts at the same position are considered a conflict.");
});

QUnit.test("Conflicts: inserting at different positions", function(assert) {
  var a = ArrayOperation.Insert(2, 'a');
  var b = ArrayOperation.Insert(4, 'b');
  assert.ok(!a.hasConflict(b) && !b.hasConflict(a), "Inserts at different positions should be fine.");
});

QUnit.test("Conflicts: deleting at the same position", function(assert) {
  // this is *not* considered a conflict as it is clear how the result should look like.
  var a = ArrayOperation.Delete(2, 'a');
  var b = ArrayOperation.Delete(2, 'a');
  assert.ok(!a.hasConflict(b) && !b.hasConflict(a), "Deletes at the same position are not a conflict.");
});

QUnit.test("Conflicts: inserting and deleting at the same position", function(assert) {
  // this is *not* considered a conflict as it is clear how the result should look like.
  var a = ArrayOperation.Insert(2, 'a');
  var b = ArrayOperation.Delete(2, 'b');
  assert.ok(!a.hasConflict(b) && !b.hasConflict(a), "Inserting and deleting at the same position is not a conflict.");
});

QUnit.test("Conflicts: when NOP involved", function(assert) {
  var a = ArrayOperation.Insert(2, 2);
  var b = new ArrayOperation({type: ArrayOperation.NOP});
  assert.ok(!a.hasConflict(b) && !b.hasConflict(a), "NOPs should never conflict.");
});
