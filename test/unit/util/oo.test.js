"use strict";

var oo = require('../../../util/oo');

QUnit.module('util/oo');

QUnit.test("oo.extend and oo.inherit should propagate static properties", function(assert) {
  function A() {}
  oo.makeExtensible(A, {'name': true});

  var B = A.extend({
    name: "foo"
  });
  assert.equal(B.static.name, 'foo', 'B should have static name "foo".');

  function C() {}
  C.Prototype = function() {
    this.name = "foo";
  };
  oo.inherit(C, A);
  assert.equal(C.static.name, 'foo', 'C should have static name "foo".');
});

QUnit.test("oo.extend and oo.inherit should use proto.static", function(assert) {
  function A() {}
  oo.makeExtensible(A);

  var B = A.extend({
    static: {
      foo: 'bar'
    }
  });
  assert.equal(B.static.foo, 'bar', 'B should have static property "foo".');

  function C() {}
  C.Prototype = function() {
    this.static = {
      foo: "bar"
    };
  };
  oo.inherit(C, A);
  assert.equal(C.static.foo, 'bar', 'C should have static property "foo".');
});
