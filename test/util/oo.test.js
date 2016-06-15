"use strict";

var test = require('../test').module('util/oo');

var oo = require('../../util/oo');

function A() {}
oo.initClass(A);
A.prototype.bla = function() {
  return "bla";
};

test("Class.extend without a protoype", function(t) {
  var B = A.extend();
  var b = new B();
  t.equal(b.bla(), 'bla', 'B should have inherited method A#bla().');
  t.end();
});

test("Class.extend with a protoype object", function(t) {
  var B = A.extend({
    blupp: function() {
      return "blupp";
    }
  });
  var b = new B();
  t.equal(b.blupp(), 'blupp', 'B should have a prototype function blupp().');
  t.end();
});

test("Class.extend with static properties", function(t) {
  var B = A.extend({
    static: {
      name: "foo"
    }
  });
  t.equal(B.static.name, 'foo', 'B should have a static property "name".');
  t.end();
});

test("Class.extend with a ChildClass", function(t) {
  function B() {}
  A.extend(B);
  var b = new B();
  t.equal(b.bla(), 'bla', 'B should have inherited method A#bla().');
  t.end();
});

test("Class.extend with a ChildClass and a prototype object", function(t) {
  function B() {}
  A.extend(B, {
    blupp: function() {
      return "blupp";
    }
  });
  var b = new B();
  t.equal(b.blupp(), 'blupp', 'B should have a prototype function blupp().');
  t.end();
});

test("Class.extend with a ChildClass and a Prototype function", function(t) {
  function B() {}
  A.extend(B, function() {
    //eslint-disable-next-line no-invalid-this
    this.blupp = function() {
      return "blupp";
    };
  });
  var b = new B();
  t.equal(b.blupp(), 'blupp', 'B should have a prototype function blupp().');
  t.end();
});

test("Legacy: Class.extend with a ChildClass with ChildClass.Prototype", function(t) {
  function B() {}
  B.Prototype = function() {
    this.blupp = function() {
      return "blupp";
    };
  };
  A.extend(B);
  var b = new B();
  t.equal(b.blupp(), 'blupp', 'B should have a prototype function blupp().');
  t.end();
});

test("Class.extend with a ChildClass and mixins.", function(t) {
  function B() {}
  var MixinA = {
    foo: "foo"
  };
  var MixinB = {
    bar: "bar"
  };
  A.extend(B, MixinA, MixinB);
  var b = new B();
  t.equal(b.foo, 'foo', 'b should have a prototype property foo.');
  t.equal(b.bar, 'bar', 'b should have a prototype property bar.');
  t.end();
});

test("Class.extend with ChildClass, mixins, and a prototype function.", function(t) {
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
  t.equal(b.foo, 'foo', 'b should have a prototype property foo.');
  t.equal(b.blupp(), 'blupp', 'b should have a prototype method blupp() coming from the Prototype function.');
  t.end();
});
