"use strict";

require('../qunit_extensions');
var TreeIndex = require('../../../util/TreeIndex');

QUnit.module('util/TreeIndex');

QUnit.test("Setting and getting values from a TreeIndex", function(assert) {
  var adapter = new TreeIndex();
  adapter.set(['a'], 1);
  adapter.set(['c', 'b'], 2);
  assert.equal(adapter.get('a'), 1, 'Top level value should be retrieved correctly.');
  assert.equal(adapter.get(['c', 'b']), 2, 'Second level value should be retrieved correctly.');
});

QUnit.test("Getting with invalid arguments", function(assert) {
  var adapter = new TreeIndex();
  adapter.set(['a'], 1);
  adapter.set(['c', 'b'], 2);
  assert.isNullOrUndefined(adapter.get('e'), 'Should return no value for unknown id');
  assert.isNullOrUndefined(adapter.get(['c', 'd']), 'Should return no value for unknown path');
  assert.isNullOrUndefined(adapter.get(null), 'Should return no value for null');
  assert.isNullOrUndefined(adapter.get(), 'Should return no value for no path');
  assert.isNullOrUndefined(adapter.get([]), 'Should return no value for empty path');
  assert.isNullOrUndefined(adapter.get({}), 'Should return no value for object');
  assert.isNullOrUndefined(adapter.get(1), 'Should return no value for a number');
});

// QUnit.test("Wrapping an existing object", function(assert) {
//   // Note: this way you can create an adapter for plain objects
//   var mine = {};
//   var adapter = TreeIndex.wrap(mine);
//   adapter.set(['a', 'b'], 2);
//   assert.equal(adapter.get(['a', 'b']), 2, 'Value should be retrievable.');
//   assert.equal(mine.a.b, 2, 'Value should have been written inplace.');
//   assert.deepEqual(adapter.get('a'), mine.a, 'Get on first level should return plain content.');
// });

QUnit.test("Getting values recursively", function(assert) {
  var adapter = new TreeIndex();
  adapter.set(['a', 'b'], 'foo');
  adapter.set(['a', 'c', 'd'], 'bar');
  assert.deepEqual(adapter.getAll('a'), { b: 'foo', d: 'bar'}, 'Values should be collected together into an object');
});

QUnit.test("Arrays: basic usage", function(assert) {
  var adapter = new TreeIndex.Arrays();
  assert.throws(function() {
    adapter.set('a', []);
  }, 'TreeIndex.set is not allowed for array type');
  adapter.add('a', 1);
  assert.deepEqual(adapter.get('a'), [1], 'Get should return an array.');
  adapter.add(['a', 'b'], 2);
  assert.deepEqual(adapter.get('a'), [1], 'Content should still be the same after adding a nested value.');
  assert.deepEqual(adapter.getAll('a'), [1, 2], 'Collect all values into an array.');
  adapter.add(['a', 'b'], 3);
  adapter.remove(['a', 'b'], 2);
  assert.deepEqual(adapter.get(['a', 'b']), [3], 'Only one value should be left after removal.');
  adapter.delete(['a','b']);
  assert.isNullOrUndefined(adapter.get(['a', 'b']), 'Value should now be deleted.');
});
