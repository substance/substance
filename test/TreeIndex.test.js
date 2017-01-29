import { module } from 'substance-test'
import TreeIndex from '../util/TreeIndex'

const test = module('TreeIndex')

test("Setting and getting values from a TreeIndex", function(t) {
  var adapter = new TreeIndex()
  adapter.set(['a'], 1)
  adapter.set(['c', 'b'], 2)
  t.equal(adapter.get('a'), 1, 'Top level value should be retrieved correctly.')
  t.equal(adapter.get(['c', 'b']), 2, 'Second level value should be retrieved correctly.')
  t.end()
})

test("Getting with invalid arguments", function(t) {
  var adapter = new TreeIndex()
  adapter.set(['a'], 1)
  adapter.set(['c', 'b'], 2)
  t.isNil(adapter.get('e'), 'Should return no value for unknown id')
  t.isNil(adapter.get(['c', 'd']), 'Should return no value for unknown path')
  t.isNil(adapter.get(null), 'Should return no value for null')
  t.isNil(adapter.get(), 'Should return no value for no path')
  t.isNil(adapter.get([]), 'Should return no value for empty path')
  t.isNil(adapter.get({}), 'Should return no value for object')
  t.isNil(adapter.get(1), 'Should return no value for a number')
  t.end()
})

// test("Wrapping an existing object", function(t) {
//   // Note: this way you can create an adapter for plain objects
//   var mine = {}
//   var adapter = TreeIndex.wrap(mine)
//   adapter.set(['a', 'b'], 2)
//   t.equal(adapter.get(['a', 'b']), 2, 'Value should be retrievable.')
//   t.equal(mine.a.b, 2, 'Value should have been written inplace.')
//   t.deepEqual(adapter.get('a'), mine.a, 'Get on first level should return plain content.')
// })

test("Getting values recursively", function(t) {
  var adapter = new TreeIndex()
  adapter.set(['a', 'b'], 'foo')
  adapter.set(['a', 'c', 'd'], 'bar')
  t.deepEqual(adapter.getAll('a'), { b: 'foo', d: 'bar'}, 'Values should be collected together into an object')
  t.end()
})

test("Arrays: basic usage", function(t) {
  var adapter = new TreeIndex.Arrays()
  t.throws(function() {
    adapter.set('a', [])
  }, 'TreeIndex.set is not allowed for array type')
  adapter.add('a', 1)
  t.deepEqual(adapter.get('a'), [1], 'Get should return an array.')
  adapter.add(['a', 'b'], 2)
  t.deepEqual(adapter.get('a'), [1], 'Content should still be the same after adding a nested value.')
  t.deepEqual(adapter.getAll('a'), [1, 2], 'Collect all values into an array.')
  adapter.add(['a', 'b'], 3)
  adapter.remove(['a', 'b'], 2)
  t.deepEqual(adapter.get(['a', 'b']), [3], 'Only one value should be left after removal.')
  adapter.delete(['a','b'])
  t.isNil(adapter.get(['a', 'b']), 'Value should now be deleted.')
  t.end()
})
