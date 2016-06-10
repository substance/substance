"use strict";

require('../QUnitExtensions');
var oo = require('../../util/oo');

QUnit.module('util/oo');

function A() {}
oo.initClass(A);
A.prototype.bla = function() {
  return "bla";
};

QUnit.test("Class.extend without a protoype", function(assert) {
  var B = A.extend();
  var b = new B();
  assert.equal(b.bla(), 'bla', 'B should have inherited method A#bla().');
});

QUnit.test("Class.extend with a protoype object", function(assert) {
  var B = A.extend({
    blupp: function() {
      return "blupp";
    }
  });
  var b = new B();
  assert.equal(b.blupp(), 'blupp', 'B should have a prototype function blupp().');
});

QUnit.test("Class.extend with static properties", function(assert) {
  var B = A.extend({
    static: {
      name: "foo"
    }
  });
  assert.equal(B.static.name, 'foo', 'B should have a static property "name".');
});

QUnit.test("Class.extend with a ChildClass", function(assert) {
  function B() {}
  A.extend(B);
  var b = new B();
  assert.equal(b.bla(), 'bla', 'B should have inherited method A#bla().');
});

QUnit.test("Class.extend with a ChildClass and a prototype object", function(assert) {
  function B() {}
  A.extend(B, {
    blupp: function() {
      return "blupp";
    }
  });
  var b = new B();
  assert.equal(b.blupp(), 'blupp', 'B should have a prototype function blupp().');
});

QUnit.test("Class.extend with a ChildClass and a Prototype function", function(assert) {
  function B() {}
  A.extend(B, function() {
    //eslint-disable-next-line no-invalid-this
    this.blupp = function() {
      return "blupp";
    };
  });
  var b = new B();
  assert.equal(b.blupp(), 'blupp', 'B should have a prototype function blupp().');
});

QUnit.test("Legacy: Class.extend with a ChildClass with ChildClass.Prototype", function(assert) {
  function B() {}
  B.Prototype = function() {
    this.blupp = function() {
      return "blupp";
    };
  };
  A.extend(B);
  var b = new B();
  assert.equal(b.blupp(), 'blupp', 'B should have a prototype function blupp().');
});

QUnit.test("Class.extend with a ChildClass and mixins.", function(assert) {
  function B() {}
  var MixinA = {
    foo: "foo"
  };
  var MixinB = {
    bar: "bar"
  };
  A.extend(B, MixinA, MixinB);
  var b = new B();
  assert.equal(b.foo, 'foo', 'b should have a prototype property foo.');
  assert.equal(b.bar, 'bar', 'b should have a prototype property bar.');
});

QUnit.test("Class.extend with ChildClass, mixins, and a prototype function.", function(assert) {
  function B() {}
  var MixinA = {
    foo: "foo",
    blupp: function() {
      return "This should not be mixed in";
    }
  };
  A.extend(B, MixinA, function() {
    //eslint-disable-next-line no-invalid-this
    this.blupp = function() {
      return "blupp";
    };
  });
  var b = new B();
  assert.equal(b.foo, 'foo', 'b should have a prototype property foo.');
  assert.equal(b.blupp(), 'blupp', 'b should have a prototype method blupp() coming from the Prototype function.');
});
