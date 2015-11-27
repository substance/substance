"use strict";

require('../qunit_extensions');
var PathAdapter = require('../../../util/PathAdapter');

QUnit.module('util/PathAdapter');

QUnit.test("Setting and getting values from a PathAdapter", function(assert) {
  var obj = new PathAdapter();
  obj.set(['a'], 1);
  obj.set(['c', 'b'], 2);
  assert.equal(obj.get('a'), 1, 'Top level value should be retrieved correctly.');
  assert.equal(obj.get(['c', 'b']), 2, 'Second level value should be retrieved correctly.');
});

QUnit.test("Getting with invalid arguments", function(assert) {
  var obj = new PathAdapter();
  obj.set(['a'], 1);
  obj.set(['c', 'b'], 2);
  assert.isNullOrUndefined(obj.get('e'));
  assert.isNullOrUndefined(obj.get(['c', 'd']));
  assert.isNullOrUndefined(obj.get({}));
  assert.isNullOrUndefined(obj.get(null));
  assert.isNullOrUndefined(obj.get([]));
});
