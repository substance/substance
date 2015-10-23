"use strict";

var _ = require('../../../helpers');
var PathAdapter = require('../../../util/PathAdapter');
var ObjectOperation = require('../../../model/data/object_operation');
var ArrayOperation = require('../../../model/data/array_operation');
var TextOperation = require('../../../model/data/text_operation');

QUnit.module('Substance.Operator/ObjectOperation');

QUnit.assert.checkObjectOperationTransform = function(a, b, input, expected) {
  var t = ObjectOperation.transform(a, b);
  var output = t[1].apply(a.apply(_.deepclone(input)));
  this.push(_.isEqual(expected, output), output, expected, "(b' o a)('"+JSON.stringify(input)+"') == '" + JSON.stringify(expected) + "' with a="+a.toString()+", b'="+t[1].toString());
  output = t[0].apply(b.apply(_.deepclone(input)));
  this.push(_.isEqual(expected, output), output, expected, "(a' o b)('"+JSON.stringify(input)+"') == '" + JSON.stringify(expected) + "' with b="+b.toString()+", a'="+t[0].toString());
};

QUnit.test("Creating values.", function(assert) {
  var path = ["a"];
  var val = { bla: "blupp" };
  var expected = {a: { bla: "blupp" } };
  var op = ObjectOperation.Create(path, val);
  var obj = {};
  op.apply(obj);
  assert.deepEqual(obj, expected, 'Should create value.');
});

QUnit.test("Creating nested values.", function(assert) {
  var path = ["a", "b"];
  var val = { bla: "blupp" };
  var expected = {a: { b: { bla: "blupp" } } };
  var op = ObjectOperation.Create(path, val);
  var obj = {"a": {}};
  op.apply(obj);
  assert.deepEqual(obj, expected, 'Should create nested value.');
});

QUnit.test("Deleting values.", function(assert) {
  var path = ["a"];
  var val = "bla";
  var op = ObjectOperation.Delete(path, val);
  var expected = {};
  var obj = {"a": "bla"};
  op.apply(obj);
  assert.deepEqual(obj, expected, 'Should delete value.');
});

QUnit.test("Deleting nested values.", function(assert) {
  var path = ["a", "b"];
  var val = "bla";
  var op = ObjectOperation.Delete(path, val);
  var expected = { a: {} };
  var obj = { a: { b: "bla"} };
  op.apply(obj);
  assert.deepEqual(obj, expected, 'Should delete nested value.');
});

QUnit.test("Deleting unknown values.", function(assert) {
  var path = ["a", "b"];
  var val = "bla";
  var op = ObjectOperation.Delete(path, val);
  var obj = { a: { c: "bla"} };
  assert.throws(function() {
    op.apply(obj);
  }, 'Should throw if deleting an unknown value.');
});

QUnit.test("Updating a text property.", function(assert) {
  var obj = {a: "bla"};
  var path = ["a"];
  var op1 = ObjectOperation.Update(path, TextOperation.Delete(2, 'a'));
  var op2 = ObjectOperation.Update(path, TextOperation.Insert(2, 'upp'));
  var expected = {a: "blupp"};
  op1.apply(obj);
  op2.apply(obj);
  assert.deepEqual(obj, expected);
});

QUnit.test("Updating an array property.", function(assert) {
  var obj = {a: [1,2,3,4,5]};
  var path = ["a"];
  var op1 = ObjectOperation.Update(path, ArrayOperation.Delete(2, 3));
  var op2 = ObjectOperation.Update(path, ArrayOperation.Insert(4, 6));
  var expected = {a: [1,2,4,5,6]};
  op1.apply(obj);
  op2.apply(obj);
  assert.deepEqual(obj, expected);
});

QUnit.test("Creating an update operation with invalid diff.", function(assert) {
  assert.throws(function() {
    ObjectOperation.Update(['test'], "foo");
  }, "Should throw.");
});

QUnit.test("Creating a top-level property using id.", function(assert) {
  var obj = {};
  var id = "foo";
  var op = ObjectOperation.Create(id, "bar");
  var expected = { "foo": "bar" };
  op.apply(obj);
  assert.deepEqual(obj, expected);
});

QUnit.test("Deleting a top-level property using id.", function(assert) {
  var obj = { foo: "bar" };
  var id = "foo";
  var op = ObjectOperation.Delete(id, "bar");
  var expected = {};
  op.apply(obj);
  assert.deepEqual(obj, expected);
});

QUnit.test("Apply operation on PathAdapter.", function(assert) {
  var myObj = new PathAdapter();
  var op = ObjectOperation.Set(['foo', 'bar'], null, 'bla');
  op.apply(myObj);
  assert.equal(myObj.get(['foo', 'bar']), 'bla');
});

QUnit.test("Creating operation with invalid data.", function(assert) {
  assert.throws(function() {
    new ObjectOperation();
  }, "Should throw when data is undefined.");
  assert.throws(function() {
    new ObjectOperation({});
  }, "Should throw when type is missing.");
  assert.throws(function() {
    new ObjectOperation({ type: 'foo', path: ['test'] });
  }, "Should throw when type is invalid.");
  assert.throws(function() {
    new ObjectOperation({
      type: ObjectOperation.CREATE
    });
  }, "Should throw when path is missing.");
  assert.throws(function() {
    new ObjectOperation({
      type: ObjectOperation.CREATE,
      path: ["test"],
    });
  }, "Should throw when created value is missing.");
  assert.throws(function() {
    new ObjectOperation({
      type: ObjectOperation.UPDATE,
      path: ["test"]
    });
  }, "Should throw when update diff is missing.");
  assert.throws(function() {
    new ObjectOperation({
      type: ObjectOperation.UPDATE,
      path: ["test"],
      diff: "foo"
    });
  }, "Should throw when update diff is invalid.");
  // we have relaxed that, so that it is possible to 'delete' a property by setting it to undefined
  // assert.throws(function() {
  //   new ObjectOperation({
  //     type: ObjectOperation.SET,
  //     path: ["test"],
  //   });
  // }, "Should throw when value is missing.");
  // assert.throws(function() {
  //   new ObjectOperation({
  //     type: ObjectOperation.SET,
  //     path: ["test"],
  //     val: 1
  //   });
  // }, "Should throw when old value is missing.");
});

QUnit.test("Inverse of NOP is NOP", function(assert) {
  var op = new ObjectOperation({type: ObjectOperation.NOP});
  var inverse = op.invert();
  assert.ok(inverse.isNOP());
});

QUnit.test("Inverse of Create is Delete and vice versa", function(assert) {
  var op = ObjectOperation.Create('test', 'foo');
  var inverse = op.invert();
  assert.ok(inverse.isDelete());
  assert.equal(inverse.getValue(), 'foo');
  inverse = inverse.invert();
  assert.ok(inverse.isCreate());
  assert.equal(inverse.getValue(), 'foo');
});

QUnit.test("Inverse of Update is Update", function(assert) {
  var op = ObjectOperation.Update(['test', 'foo'], ArrayOperation.Insert(1, 'a'));
  var inverse = op.invert();
  assert.ok(inverse.isUpdate());
  assert.deepEqual(inverse.getPath(), ['test', 'foo']);
  assert.ok(inverse.diff instanceof ArrayOperation);
  assert.deepEqual(inverse.diff.toJSON(), op.diff.invert().toJSON());
  // same with a text operation as diff
  op = ObjectOperation.Update(['test', 'foo'], TextOperation.Insert(1, 'a'));
  inverse = op.invert();
  assert.ok(inverse.diff instanceof TextOperation);
  assert.deepEqual(inverse.diff.toJSON(), op.diff.invert().toJSON());
});

QUnit.test("Inverse of Set is Set", function(assert) {
  var op = ObjectOperation.Set(['test', 'foo'], 'foo', 'bar');
  var inverse = op.invert();
  assert.ok(inverse.isSet());
  assert.deepEqual(inverse.getPath(), ['test', 'foo']);
  assert.equal(inverse.getValue(), 'foo');
  assert.equal(inverse.original, 'bar');
});

QUnit.test("Transformation: everything easy when not the same property", function(assert) {
  var path1 = ["a"];
  var path2 = ["b"];
  var val1 = "bla";
  var val2 = "blupp";
  var a = ObjectOperation.Create(path1, val1);
  var b = ObjectOperation.Create(path2, val2);
  var t = ObjectOperation.transform(a, b);
  assert.deepEqual(t[0].toJSON(), a.toJSON());
  assert.deepEqual(t[1].toJSON(), b.toJSON());
});

QUnit.test("Transformation: everything easy when NOP involved", function(assert) {
  var path1 = ["a"];
  var val1 = "bla";
  var a = ObjectOperation.Create(path1, val1);
  var b = new ObjectOperation({type: ObjectOperation.NOP});
  var t = ObjectOperation.transform(a, b);
  assert.deepEqual(t[0].toJSON(), a.toJSON());
  assert.deepEqual(t[1].toJSON(), b.toJSON());
});

QUnit.test("Transformation: creating the same value (unresolvable conflict)", function(assert) {
  var path = ["a"];
  var val1 = "bla";
  var val2 = "blupp";
  var a = ObjectOperation.Create(path, val1);
  var b = ObjectOperation.Create(path, val2);
  assert.throws(function() {
    ObjectOperation.transform(a, b);
  });
});

QUnit.test("Transformation: creating and updating the same value (unresolvable conflict)", function(assert) {
  var path = ["a"];
  var val1 = "bla";
  var a = ObjectOperation.Create(path, val1);
  var b = ObjectOperation.Update(path, TextOperation.Insert(1, 'b'));
  assert.throws(function() {
    ObjectOperation.transform(a, b);
  });
});

QUnit.test("Transformation: creating and setting the same value (unresolvable conflict)", function(assert) {
  var path = ["a"];
  var val1 = "bla";
  var val2 = "blupp";
  var a = ObjectOperation.Create(path, val1);
  var b = ObjectOperation.Set(path, val1, val2);
  assert.throws(function() {
    ObjectOperation.transform(a, b);
  });
});

QUnit.test("Transformation: creating and deleting the same value (unresolvable conflict)", function(assert) {
  var path = ["a"];
  var val1 = "bla";
  var a = ObjectOperation.Create(path, val1);
  var b = ObjectOperation.Delete(path, val1);
  assert.throws(function() {
    ObjectOperation.transform(a, b);
  });
});

QUnit.test("Transformation: deleting the same value", function(assert) {
  var path = ["a"];
  var val = "bla";
  var input = {"a": val};
  var expected = {};
  var a = ObjectOperation.Delete(path, val);
  var b = ObjectOperation.Delete(path, val);
  assert.checkObjectOperationTransform(a, b, input, expected);
  assert.checkObjectOperationTransform(b, a, input, expected);
});

QUnit.test("Transformation: deleting and updating the same value", function(assert) {
  var path = ["a"];
  var a = ObjectOperation.Delete(path, "bla");
  var b = ObjectOperation.Update(path, TextOperation.Insert(3, "pp"));
  var input = {a : "bla"};
  var expected1 = {a: "blapp"};
  var expected2 = {};
  assert.checkObjectOperationTransform(a, b, input, expected1);
  assert.checkObjectOperationTransform(b, a, input, expected2);
  // same with an array operation
  a = ObjectOperation.Delete(path, [1,2,3]);
  b = ObjectOperation.Update(path, ArrayOperation.Insert(3, 4));
  input = {a : [1,2,3]};
  expected1 = {a: [1,2,3,4]};
  expected2 = {};
  assert.checkObjectOperationTransform(a, b, input, expected1);
  assert.checkObjectOperationTransform(b, a, input, expected2);
});

QUnit.test("Transformation: deleting and setting the same value", function(assert) {
  var path = ["a"];
  var a = ObjectOperation.Delete(path, "bla");
  var b = ObjectOperation.Set(path, "bla", "blupp");
  var input = {a : "bla"};
  var expected1 = {a: "blupp"};
  var expected2 = {};
  assert.checkObjectOperationTransform(a, b, input, expected1);
  assert.checkObjectOperationTransform(b, a, input, expected2);
});

QUnit.test("Transformation: updating the same value", function(assert) {
  var path = ["a"];
  var a = ObjectOperation.Update(path, TextOperation.Insert(3, "pp"));
  var b = ObjectOperation.Update(path, TextOperation.Insert(3, "ff"));
  var input = {a : "bla"};
  var expected1 = {a: "blappff"};
  var expected2 = {a: "blaffpp"};
  assert.checkObjectOperationTransform(a, b, input, expected1);
  assert.checkObjectOperationTransform(b, a, input, expected2);
  // same with array updates
  a = ObjectOperation.Update(path, ArrayOperation.Insert(2, 3));
  b = ObjectOperation.Update(path, ArrayOperation.Insert(2, 4));
  input = {a : [1,2,5]};
  expected1 = {a: [1,2,3,4,5]};
  expected2 = {a: [1,2,4,3,5]};
  assert.checkObjectOperationTransform(a, b, input, expected1);
  assert.checkObjectOperationTransform(b, a, input, expected2);
});

QUnit.test("Transformation: updating and setting the same value (unresolvable conflict)", function(assert) {
  var path = ["a"];
  var a = ObjectOperation.Update(path, TextOperation.Insert(3, "ff"));
  var b = ObjectOperation.Set(path, "bla", "blupp");
  assert.throws(function() {
    ObjectOperation.transform(a, b);
  });
});

QUnit.test("Transformation: setting the same value", function(assert) {
  var path = ["a"];
  var a = ObjectOperation.Set(path, "bla", "blapp");
  var b = ObjectOperation.Set(path, "bla", "blupp");
  var input = {a : "bla"};
  var expected1 = {a: "blupp"};
  var expected2 = {a: "blapp"};
  assert.checkObjectOperationTransform(a, b, input, expected1);
  assert.checkObjectOperationTransform(b, a, input, expected2);
});

QUnit.test("ObjectOperation with the same path are conflicts.", function(assert) {
  var a = ObjectOperation.Set(['bla', 'blupp'], null, 'foo');
  var b = ObjectOperation.Set(['bla', 'blupp'], null, 'bar');
  assert.ok(a.hasConflict(b) && b.hasConflict(a));
});

QUnit.test("NOPs have never conflicts.", function(assert) {
  var a = ObjectOperation.Set(['bla', 'blupp'], null, 'foo');
  var b = new ObjectOperation({type: ObjectOperation.NOP});
  assert.ok(!a.hasConflict(b) && !b.hasConflict(a));
});

QUnit.test("With option 'no-conflict' conflicting operations can not be transformed.", function(assert) {
  var a = ObjectOperation.Create('bla', 'blupp');
  var b = ObjectOperation.Create('bla', 'blupp');
  assert.throws(function() {
    ObjectOperation.transform(a, b, { "no-conflict": true });
  }, 'Transforming conflicting ops should throw when option "no-conflict" is enabled.');
});

QUnit.test("JSON deserialisation", function(assert) {
  var path = ["test", "foo"];

  var op = ObjectOperation.fromJSON({
    type: ObjectOperation.SET,
    path: path,
    val: "bla",
    original: "blupp"
  });
  assert.equal(op.getType(), ObjectOperation.SET);
  assert.equal(op.getValue(), "bla");

  op = ObjectOperation.fromJSON({
    type: ObjectOperation.UPDATE,
    path: path,
    diff: ArrayOperation.Insert(1, 'a'),
    propertyType: 'array'
  });
  assert.ok(op.diff instanceof ArrayOperation);
  assert.deepEqual(op.getPath(), path);
  op = ObjectOperation.fromJSON({
    type: ObjectOperation.UPDATE,
    path: path,
    diff: TextOperation.Insert(1, 'a'),
    propertyType: 'string'
  });
  assert.ok(op.diff instanceof TextOperation);
  assert.deepEqual(op.getPath(), path);

  assert.throws(function() {
    ObjectOperation.fromJSON({
      type: ObjectOperation.UPDATE,
      path: path,
      diff: "bla",
      propertyType: 'foo'
    });
  }, "Should throw for unknown update diff type.");
});

QUnit.test("JSON serialisation", function(assert) {
  var data = ObjectOperation.Create('test', "bla").toJSON();
  assert.equal(data.type, ObjectOperation.CREATE);
  assert.equal(data.val, "bla");
  data = ObjectOperation.Delete('test', "bla").toJSON();
  assert.equal(data.type, ObjectOperation.DELETE);
  assert.equal(data.val, "bla");
  data = ObjectOperation.Update(['test', 'foo'], ArrayOperation.Insert(1, 'a')).toJSON();
  assert.equal(data.type, ObjectOperation.UPDATE);
  assert.equal(data.propertyType, 'array');
  data = ObjectOperation.Update(['test', 'foo'], TextOperation.Insert(1, 'a')).toJSON();
  assert.equal(data.propertyType, 'string');
  data = ObjectOperation.Set(['test', 'foo'], 'foo', 'bar').toJSON();
  assert.equal(data.type, ObjectOperation.SET);
  assert.equal(data.val, 'bar');
  assert.equal(data.original, 'foo');
});
