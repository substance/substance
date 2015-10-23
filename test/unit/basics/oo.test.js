"use strict";

var OO = require('../../../util/oo');

QUnit.module('Substance.OO');

QUnit.test("OO.extend and OO.inherit should propagate static properties", function(assert) {
  function A() {}
  OO.makeExtensible(A, {'name': true});

  var B = A.extend({
    name: "foo"
  });
  assert.equal(B.static.name, 'foo', 'B should have static name "foo".');

  function C() {}
  C.Prototype = function() {
    this.name = "foo";
  };
  OO.inherit(C, A);
  assert.equal(C.static.name, 'foo', 'C should have static name "foo".');
});

QUnit.test("OO.extend and OO.inherit should use proto.static", function(assert) {
  function A() {}
  OO.makeExtensible(A);

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
  OO.inherit(C, A);
  assert.equal(C.static.foo, 'bar', 'C should have static property "foo".');
});
