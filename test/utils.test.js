import { module } from 'substance-test'
import flattenOften from '../util/flattenOften'
import isEqual from '../util/isEqual'

const test = module('utils')

test('flattenOften should flatten multiple rounds', (t) => {
  let arr = [1, [2, 3, [4, 5]]]
  let result = flattenOften(arr, 2)
  t.deepEqual([1, 2, 3, 4, 5], result, 'array should be flattened.')
  t.end()
})

test('flattenOften should stop at max', (t) => {
  let arr = [1, [2, 3, [4, 5]]]
  let result = flattenOften(arr, 1)
  t.deepEqual([1, 2, 3, [4, 5]], result, 'array should be flattened only once.')
  t.end()
})

test('isEqual on primitives', (t) => {
  t.ok(isEqual(1,1), '1 === 1')
  t.ok(isEqual("foo", "foo"), '"foo" === "foo"')
  t.notOk(isEqual("foo", "bar"), '"foo" !== "bar"')
  t.notOk(isEqual(null, undefined), 'null !== undefined')
  t.end()
})

test('isEqual on arrays', (t) => {
  t.ok(isEqual([1, [2, 3, [4, 5]]], [1, [2, 3, [4, 5]]]), 'should do a deep array comparison')
  t.notOk(isEqual([1, [2, 3, [4, 5]]], [1, [2, 3, [4, 5, 6]]]), 'should detect inequality on deeper level')
  t.end()
})

test('isEqual on objects', (t) => {
  t.ok(isEqual({ foo: 'foo', bar: { bla: 'bla', blupp: {} }, baz: [1, 2, 3] }, { foo: 'foo', bar: { bla: 'bla', blupp: {} }, baz: [1, 2, 3] }), 'should do a deep object comparison')
  t.notOk(isEqual({ foo: 'foo', bar: { bla: 'bla', blupp: {} }, baz: [1, 2, 3] }, { foo: 'foo', bar: { bla: 'bla', blupp: { a: 'a'} }, baz: [1, 2, 3] }), 'should detect inequality on deeper level')
  t.end()
})
