import { module } from 'substance-test'
import { TextOperation } from 'substance'

const test = module('TextOperation')

function checkTextTransform(test, a, b, input, expected) {
  let ops = TextOperation.transform(a, b)
  let output = ops[1].apply(a.apply(input))
  test.deepEqual(output, expected, `(b' o a)('${input}') == '${expected}' with a=${a.toString()}, b'=${ops[1].toString()}`)
  output = ops[0].apply(b.apply(input))
  test.deepEqual(output, expected, `(a' o b)('${input}') == '${expected}' with b=${b.toString()}, a'=${ops[0].toString()}`)
}

test("Insert string", (t) => {
  let input = "Lorem ipsum"
  let expected = "Lorem bla ipsum"
  let a = TextOperation.Insert(6, "bla ")
  t.equal(expected, a.apply(input))
  t.end()
})

test("Insert at last position", (t) => {
  let input = "Lorem ipsum"
  let expected = "Lorem ipsum."
  let a = TextOperation.Insert(11, ".")
  t.equal(expected, a.apply(input))
  t.end()
})

test("Invalid arguments", (t) => {
  t.throws(function() {
    new TextOperation({})
  }, "Should throw for incomplete data.")
  t.throws(function() {
    new TextOperation({type: "foo", pos: 0, str: ""})
  }, "Should throw for invalid type.")
  t.throws(function() {
    TextOperation.Insert(-1, "")
  }, "Should throw for invalid position.")
  t.throws(function() {
    TextOperation.Insert(-1, null)
  }, "Should throw for invalid string.")
  t.end()
})

test("TextOperation has length", (t) => {
  let op = TextOperation.Delete(1, 'bla')
  t.equal(op.getLength(), 3, 'Length of ' + op.toString() + ' should be 3.')
  op = TextOperation.Insert(1, 'blupp')
  t.equal(op.getLength(), 5, 'Length of ' + op.toString() + ' should be 5.')
  t.end()
})

test("JSON serialisation", (t) => {
  let op = TextOperation.Delete(1, 'bla')
  let expected = {
    type: TextOperation.DELETE,
    pos: 1,
    str: 'bla'
  }
  t.deepEqual(op.toJSON(), expected, 'Serialized operation should ok.')
  t.end()
})

test("JSON deserialisation", (t) => {
  let data = {
    type: TextOperation.INSERT,
    pos: 1,
    str: "bla"
  }
  let op = TextOperation.fromJSON(data)
  t.ok(op.isInsert(), 'Deserialized operation should be an insert operation.')
  t.ok(op.pos === 1, 'Deserialized operation should have offset==1.')
  t.ok(op.str === "bla", 'Deserialized operation should have string=="bla".')
  t.end()
})

test("Empty TextOperations are NOPs", (t) => {
  let op = TextOperation.Insert(0, "")
  t.ok(op.isNOP(), 'Empty operations should be NOPs.')
  t.end()
})

test("Can't apply on a too short string", (t) => {
  let op = TextOperation.Insert(6, "bla")
  t.throws(function() {
    op.apply('bla')
  }, "Should throw if string is too short.")
  op = TextOperation.Delete(2, "bla")
  t.throws(function() {
    op.apply('bla')
  }, "Should throw if string is too short.")
  t.end()
})

test("Can be applied on custom String implementation", (t) => {
  let CustomString = function(str) {
    this.arr = str.split('')
    this.splice = function(pos, remove, insert) {
      this.arr.splice(pos, remove)
      if (insert) {
        this.arr = this.arr.slice(0, pos).concat(insert.split('')).concat(this.arr.slice(pos))
      }
    }
    this.toString = function() {
      return this.arr.join('')
    }
  }
  Object.defineProperty(CustomString.prototype, 'length', {
    get: function() {
      return this.arr.length
    }
  })
  let str = new CustomString('Lorem ipsum.')
  let op = TextOperation.Insert(6, "bla ")
  op.apply(str)
  t.equal(str.toString(), 'Lorem bla ipsum.', 'Insert operation should work on custom string.')
  str = new CustomString('Lorem bla ipsum.')
  op = TextOperation.Delete(6, "bla ")
  op.apply(str)
  t.equal(str.toString(), 'Lorem ipsum.', 'Delete operation should work on custom string.')
  t.end()
})

test("Inversion of Insert = Delete", (t) => {
  let op = TextOperation.Insert(6, "bla")
  let inverse = op.invert()
  t.ok(inverse.isDelete(), 'Inverted operation should be a delete op.')
  t.equal(inverse.pos, op.pos, 'Inverted operation should have the same offset.')
  t.equal(inverse.str, op.str, 'Inverted operation should have the same string data.')
  t.end()
})

test("Inversion of Delete = Insert", (t) => {
  let op = TextOperation.Delete(6, "bla")
  let inverse = op.invert()
  t.ok(inverse.isInsert(), 'Inverted operation should be a insert op.')
  t.equal(inverse.pos, op.pos, 'Inverted operation should have the same offset.')
  t.equal(inverse.str, op.str, 'Inverted operation should have the same string data.')
  t.end()
})

test("Transformation: a=Insert, b=Insert, a before b", (t) => {
  let input = "Lorem ipsum"
  let expected = "Lorem bla ipsum blupp"
  let a = TextOperation.Insert(6, "bla ")
  let b = TextOperation.Insert(11, " blupp")
  checkTextTransform(t, a, b, input, expected)
  checkTextTransform(t, b, a, input, expected)
  t.end()
})

test("Transformation: a=Insert, b=Insert, same position", (t) => {
  let input = "Lorem ipsum"
  let a = TextOperation.Insert(6, "bla ")
  let b = TextOperation.Insert(6, "blupp ")
  let expected = "Lorem bla blupp ipsum"
  // applying b first gives a different result
  let expected_2 = "Lorem blupp bla ipsum"
  checkTextTransform(t, a, b, input, expected)
  checkTextTransform(t, b, a, input, expected_2)
  t.end()
})

test("Transformation: a=Delete, b=Delete, a before b", (t) => {
  let input = "Lorem ipsum dolor sit amet"
  let expected = "Lorem dolor amet"
  let a = TextOperation.Delete(6, "ipsum ")
  let b = TextOperation.Delete(18, "sit ")
  checkTextTransform(t, a, b, input, expected)
  checkTextTransform(t, b, a, input, expected)
  t.end()
})

test("Transformation: a=Delete, b=Delete, overlapping", (t) => {
  let input = "Lorem ipsum dolor sit amet"
  let expected = "Lorem amet"
  let a = TextOperation.Delete(6, "ipsum dolor sit ")
  let b = TextOperation.Delete(12, "dolor ")
  checkTextTransform(t, a, b, input, expected)
  checkTextTransform(t, b, a, input, expected)
  t.end()
})

test("Transformation: a=Delete, b=Delete, same position", (t) => {
  let input = "Lorem ipsum dolor sit amet"
  let expected = "Lorem amet"
  let a = TextOperation.Delete(6, "ipsum dolor ")
  let b = TextOperation.Delete(6, "ipsum dolor sit ")
  checkTextTransform(t, a, b, input, expected)
  checkTextTransform(t, b, a, input, expected)
  t.end()
})

test("Transformation: a=Insert, b=Delete", (t) => {
  let input = "Lorem dolor sit amet"
  let expected = "Lorem ipsum dolor amet"
  let a = TextOperation.Insert(6, "ipsum ")
  let b = TextOperation.Delete(12, "sit ")
  checkTextTransform(t, a, b, input, expected)
  checkTextTransform(t, b, a, input, expected)
  t.end()
})

test("Transformation: a=Insert, b=Delete, a after b", (t) => {
  let input = "Lorem ipsum dolor amet"
  let expected = "Lorem dolor sit amet"
  let a = TextOperation.Insert(18, "sit ")
  let b = TextOperation.Delete(6, "ipsum ")
  checkTextTransform(t, a, b, input, expected)
  checkTextTransform(t, b, a, input, expected)
  t.end()
})

test("Transformation: a=Insert, b=Delete, overlap", (t) => {
  let input = "Lorem dolor sit amet"
  let expected = "Lorem amet"
  let a = TextOperation.Insert(12, "ipsum ")
  let b = TextOperation.Delete(6, "dolor sit ")
  checkTextTransform(t, a, b, input, expected)
  checkTextTransform(t, b, a, input, expected)
  t.end()
})

test("Transformations can be done inplace (optimzation for internal use)", (t) => {
  let a = TextOperation.Insert(6, "bla ")
  let b = TextOperation.Insert(6, "blupp ")
  let ops = TextOperation.transform(a, b, {inplace: true})
  t.ok(a.pos === ops[0].pos && b.pos === ops[1].pos, "Transformation should be done inplace.")
  t.end()
})

// Note: In the case of TextOperations conflicts are soft, i.e., there is a defined result
// in such cases. However in certain situations it makes sense to detect such cases, e.g. to notify
// the user to review the result.

test("Conflict: Insert at the same position", (t) => {
  let a = TextOperation.Insert(6, "bla")
  let b = TextOperation.Insert(6, "blupp")
  t.ok(a.hasConflict(b), 'Two inserts are considered a conflict if they are at the same position.')
  t.end()
})

test("Conflict: Delete with overlapping range", (t) => {
  let a = TextOperation.Delete(4, "bla")
  let b = TextOperation.Delete(6, "blupp")
  t.ok(a.hasConflict(b) && b.hasConflict(a), 'Two deletes are considered a conflict if they overlap.')
  t.end()
})

test("Conflict: Delete and Insert with overlapping range", (t) => {
  let a = TextOperation.Insert(4, "bla")
  let b = TextOperation.Delete(2, "blupp")
  t.ok(a.hasConflict(b) && b.hasConflict(a), 'Inserts and Deletes are considered a conflict if they overlap.')
  t.end()
})

test("With option 'no-conflict' conflicting operations can not be transformed.", (t) => {
  let a = TextOperation.Insert(4, "bla")
  let b = TextOperation.Delete(2, "blupp")
  t.throws(function() {
    TextOperation.transform(a, b, { "no-conflict": true })
  }, 'Transforming conflicting ops should throw when option "no-conflict" is enabled.')
  t.end()
});