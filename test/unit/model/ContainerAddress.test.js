'use strict';

require('../qunit_extensions');
var ContainerAddress = require('../../../model/ContainerAddress');

QUnit.module('model/ContainerAddress');

QUnit.test("[0,1] is before [1,0]", function(assert) {
  var first = new ContainerAddress(0, 1);
  var second = new ContainerAddress(1, 0);
  assert.ok(first.isBefore(second, 'strict'));
  assert.ok(first.isBefore(second));
});

QUnit.test("[1,0] is not before [0,1]", function(assert) {
  var first = new ContainerAddress(1, 0);
  var second = new ContainerAddress(0, 1);
  assert.notOk(first.isBefore(second, 'strict'));
  assert.notOk(first.isBefore(second));
});

QUnit.test("[0,0] is before [0,1]", function(assert) {
  var first = new ContainerAddress(0, 0);
  var second = new ContainerAddress(0, 1);
  assert.ok(first.isBefore(second, 'strict'));
  assert.ok(first.isBefore(second));
});

QUnit.test("[0,1] is not before [0,0]", function(assert) {
  var first = new ContainerAddress(0, 1);
  var second = new ContainerAddress(0, 0);
  assert.notOk(first.isBefore(second, 'strict'));
  assert.notOk(first.isBefore(second));
});

QUnit.test("[0,1] is not-strictly before [0,1]", function(assert) {
  var first = new ContainerAddress(0, 1);
  var second = new ContainerAddress(0, 1);
  assert.notOk(first.isBefore(second, 'strict'));
  assert.ok(first.isBefore(second));
});

QUnit.test("[0,1] is equal to [0,1]", function(assert) {
  var first = new ContainerAddress(0, 1);
  var second = new ContainerAddress(0, 1);
  assert.ok(first.isEqual(second));
});
