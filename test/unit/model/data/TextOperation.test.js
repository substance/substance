"use strict";
require('../../qunit_extensions');

var _ = require('../../../../util/helpers');
var TextOperation = require('../../../../model/data/TextOperation');

QUnit.module('model/data/TextOperation');

QUnit.assert.checkTextTransform = function(a, b, input, expected) {
  var t = TextOperation.transform(a, b);
  var s = t[1].apply(a.apply(input));
  this.push(_.isEqual(expected, s), s, expected, "(b' o a)('"+input+"') == '" + expected + "' with a="+a.toString()+", b'="+t[1].toString());
  s = t[0].apply(b.apply(input));
  this.push(_.isEqual(expected, s), s, expected, "(a' o b)('"+input+"') == '" + expected + "' with b="+b.toString()+", a'="+t[0].toString());
};

QUnit.test("Insert string", function(assert) {
  var input = "Lorem ipsum";
  var expected = "Lorem bla ipsum";
  var a = TextOperation.Insert(6, "bla ");
  assert.equal(expected, a.apply(input));
});

QUnit.test("Insert at last position", function(assert) {
  var input = "Lorem ipsum";
  var expected = "Lorem ipsum.";
  var a = TextOperation.Insert(11, ".");
  assert.equal(expected, a.apply(input));
});

QUnit.test("Invalid arguments", function(assert) {
  assert.throws(function() {
    new TextOperation({});
  }, "Should throw for incomplete data.");
  assert.throws(function() {
    new TextOperation({type: "foo", pos: 0, str: ""});
  }, "Should throw for invalid type.");
  assert.throws(function() {
    TextOperation.Insert(-1, "");
  }, "Should throw for invalid position.");
  assert.throws(function() {
    TextOperation.Insert(-1, null);
  }, "Should throw for invalid string.");
});

QUnit.test("TextOperation has length", function(assert) {
  var op = TextOperation.Delete(1, 'bla');
  assert.equal(op.getLength(), 3, 'Length of ' + op.toString() + ' should be 3.');
  op = TextOperation.Insert(1, 'blupp');
  assert.equal(op.getLength(), 5, 'Length of ' + op.toString() + ' should be 5.');
});

QUnit.test("JSON serialisation", function(assert) {
  var op = TextOperation.Delete(1, 'bla');
  var expected = {
    type: TextOperation.DELETE,
    pos: 1,
    str: 'bla'
  };
  assert.deepEqual(op.toJSON(), expected, 'Serialized operation should ok.');
});

QUnit.test("JSON deserialisation", function(assert) {
  var data = {
    type: TextOperation.INSERT,
    pos: 1,
    str: "bla"
  };
  var op = TextOperation.fromJSON(data);
  assert.ok(op.isInsert(), 'Deserialized operation should be an insert operation.');
  assert.ok(op.pos === 1, 'Deserialized operation should have offset==1.');
  assert.ok(op.str === "bla", 'Deserialized operation should have string=="bla".');
});

QUnit.test("Empty TextOperations are NOPs", function(assert) {
  var op = TextOperation.Insert(0, "");
  assert.ok(op.isNOP(), 'Empty operations should be NOPs.');
});

QUnit.test("Can't apply on a too short string", function(assert) {
  var op = TextOperation.Insert(6, "bla");
  assert.throws(function() {
    op.apply('bla');
  }, "Should throw if string is too short.");
  op = TextOperation.Delete(2, "bla");
  assert.throws(function() {
    op.apply('bla');
  }, "Should throw if string is too short.");
});

QUnit.test("Can be applied on custom String implementation", function(assert) {
  var CustomString = function(str) {
    this.arr = str.split('');
    this.splice = function(pos, remove, insert) {
      this.arr.splice(pos, remove);
      if (insert) {
        this.arr = this.arr.slice(0, pos).concat(insert.split('')).concat(this.arr.slice(pos));
      }
    };
    this.toString = function() {
      return this.arr.join('');
    };
  };
  Object.defineProperty(CustomString.prototype, 'length', {
    get: function() {
      return this.arr.length;
    }
  });
  var str = new CustomString('Lorem ipsum.');
  var op = TextOperation.Insert(6, "bla ");
  op.apply(str);
  assert.equal(str.toString(), 'Lorem bla ipsum.', 'Insert operation should work on custom string.');
  str = new CustomString('Lorem bla ipsum.');
  op = TextOperation.Delete(6, "bla ");
  op.apply(str);
  assert.equal(str.toString(), 'Lorem ipsum.', 'Delete operation should work on custom string.');
});

QUnit.test("Inversion of Insert = Delete", function(assert) {
  var op = TextOperation.Insert(6, "bla");
  var inverse = op.invert();
  assert.ok(inverse.isDelete(), 'Inverted operation should be a delete op.');
  assert.equal(inverse.pos, op.pos, 'Inverted operation should have the same offset.');
  assert.equal(inverse.str, op.str, 'Inverted operation should have the same string data.');
});

QUnit.test("Inversion of Delete = Insert", function(assert) {
  var op = TextOperation.Delete(6, "bla");
  var inverse = op.invert();
  assert.ok(inverse.isInsert(), 'Inverted operation should be a insert op.');
  assert.equal(inverse.pos, op.pos, 'Inverted operation should have the same offset.');
  assert.equal(inverse.str, op.str, 'Inverted operation should have the same string data.');
});

QUnit.test("Transformation: a=Insert, b=Insert, a before b", function(assert) {
  var input = "Lorem ipsum";
  var expected = "Lorem bla ipsum blupp";
  var a = TextOperation.Insert(6, "bla ");
  var b = TextOperation.Insert(11, " blupp");
  assert.checkTextTransform(a, b, input, expected);
  assert.checkTextTransform(b, a, input, expected);
});

QUnit.test("Transformation: a=Insert, b=Insert, same position", function(assert) {
  var input = "Lorem ipsum";
  var a = TextOperation.Insert(6, "bla ");
  var b = TextOperation.Insert(6, "blupp ");
  var expected = "Lorem bla blupp ipsum";
  // applying b first gives a different result
  var expected_2 = "Lorem blupp bla ipsum";
  assert.checkTextTransform(a, b, input, expected);
  assert.checkTextTransform(b, a, input, expected_2);
});

QUnit.test("Transformation: a=Delete, b=Delete, a before b", function(assert) {
  var input = "Lorem ipsum dolor sit amet";
  var expected = "Lorem dolor amet";
  var a = TextOperation.Delete(6, "ipsum ");
  var b = TextOperation.Delete(18, "sit ");
  assert.checkTextTransform(a, b, input, expected);
  assert.checkTextTransform(b, a, input, expected);
});

QUnit.test("Transformation: a=Delete, b=Delete, overlapping", function(assert) {
  var input = "Lorem ipsum dolor sit amet";
  var expected = "Lorem amet";
  var a = TextOperation.Delete(6, "ipsum dolor sit ");
  var b = TextOperation.Delete(12, "dolor ");
  assert.checkTextTransform(a, b, input, expected);
  assert.checkTextTransform(b, a, input, expected);
});

QUnit.test("Transformation: a=Delete, b=Delete, same position", function(assert) {
  var input = "Lorem ipsum dolor sit amet";
  var expected = "Lorem amet";
  var a = TextOperation.Delete(6, "ipsum dolor ");
  var b = TextOperation.Delete(6, "ipsum dolor sit ");
  assert.checkTextTransform(a, b, input, expected);
  assert.checkTextTransform(b, a, input, expected);
});

QUnit.test("Transformation: a=Insert, b=Delete", function(assert) {
  var input = "Lorem dolor sit amet";
  var expected = "Lorem ipsum dolor amet";
  var a = TextOperation.Insert(6, "ipsum ");
  var b = TextOperation.Delete(12, "sit ");
  assert.checkTextTransform(a, b, input, expected);
  assert.checkTextTransform(b, a, input, expected);
});

QUnit.test("Transformation: a=Insert, b=Delete, a after b", function(assert) {
  var input = "Lorem ipsum dolor amet";
  var expected = "Lorem dolor sit amet";
  var a = TextOperation.Insert(18, "sit ");
  var b = TextOperation.Delete(6, "ipsum ");
  assert.checkTextTransform(a, b, input, expected);
  assert.checkTextTransform(b, a, input, expected);
});

QUnit.test("Transformation: a=Insert, b=Delete, overlap", function(assert) {
  var input = "Lorem dolor sit amet";
  var expected = "Lorem amet";
  var a = TextOperation.Insert(12, "ipsum ");
  var b = TextOperation.Delete(6, "dolor sit ");
  assert.checkTextTransform(a, b, input, expected);
  assert.checkTextTransform(b, a, input, expected);
});

QUnit.test("Transformations can be done inplace (optimzation for internal use)", function(assert) {
  // var input = "Lorem ipsum";
  var a = TextOperation.Insert(6, "bla ");
  var b = TextOperation.Insert(6, "blupp ");
  var t = TextOperation.transform(a, b, {inplace: true});
  assert.ok(a.pos === t[0].pos && b.pos === t[1].pos, "Transformation should be done inplace.");
});

// Note: In the case of TextOperations conflicts are soft, i.e., there is a defined result
// in such cases. However in certain situations it makes sense to detect such cases, e.g. to notify
// the user to review the result.

QUnit.test("Conflict: Insert at the same position", function(assert) {
  var a = TextOperation.Insert(6, "bla");
  var b = TextOperation.Insert(6, "blupp");
  assert.ok(a.hasConflict(b), 'Two inserts are considered a conflict if they are at the same position.');
});

QUnit.test("Conflict: Delete with overlapping range", function(assert) {
  var a = TextOperation.Delete(4, "bla");
  var b = TextOperation.Delete(6, "blupp");
  assert.ok(a.hasConflict(b) && b.hasConflict(a), 'Two deletes are considered a conflict if they overlap.');
});

QUnit.test("Conflict: Delete and Insert with overlapping range", function(assert) {
  var a = TextOperation.Insert(4, "bla");
  var b = TextOperation.Delete(2, "blupp");
  assert.ok(a.hasConflict(b) && b.hasConflict(a), 'Inserts and Deletes are considered a conflict if they overlap.');
});

QUnit.test("With option 'no-conflict' conflicting operations can not be transformed.", function(assert) {
  var a = TextOperation.Insert(4, "bla");
  var b = TextOperation.Delete(2, "blupp");
  assert.throws(function() {
    TextOperation.transform(a, b, { "no-conflict": true });
  }, 'Transforming conflicting ops should throw when option "no-conflict" is enabled.');
});
