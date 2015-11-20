/* jshint latedef:nofunc */

'use strict';

var isObject = require('lodash/lang/isObject');
var isFunction = require('lodash/lang/isFunction');
// WORKAROUND: using the phantomjs Function.prototype.bind polyfill
// the implementation in this file does not work strangely.
// it works however if we are using lodash bind here
// For whatever reason, the polyfill works alright in other places.
var bind = require('lodash/function/bind');

/**
 * Helpers for oo programming.
 *
 * @module
 */
var oo = {};

/**
  Initialize a class.

  After initializing a class has a `static` scope which can be used for static properties
  and functions. These static members get inherited by subclasses, which makes this approach
  as close as possible to ES6.

  An initialized class has an `extend` function which can be used to derive subclasses.

  @param {Constructor} clazz

  @example

  ```
  function MyClass() {
    ...
  }
  oo.initClass(MyClass);
  ```

  #### Extending a class

  The simplest way to create a subclass is

  ```
  var Foo = MyClass.extend()
  ```

  This is the disadvantage, that the created class is anonymous, i.e., in a debugger it
  does not have a senseful name.

  The preferred way is to extend a subclass this way:

  ```
  function Foo() {
    Foo.super.apply(this, arguments);
  }
  MyClass.extend(Foo);
  ```

  This correnponds to what would do in ES6 with

  ```
  class Foo extends MyClass {}
  ```

  It is also possible to derive a class and provide a prototype as an object:

  ```
  var Foo = MyClass.extend({
    bla: function() { return "bla"; }
  });
  ```

  Again the result is an anonymous class, without the ability to show a meaningful name in a
  debugger.

  If you want to define a prototype, the preferred way is extending an already defined class:

  ```
  function Foo() {
    Foo.super.apply(this, arguments);
  }
  MyClass.extend(Foo, {
    bla: function() { return "bla"; }
  });
  ```

  If you prefer to write prototypes as functions you should do it this way:

  ```
  function Foo() {
    Foo.super.apply(this, arguments);
  }
  MyClass.extend(Foo, function() {
    this.bla = function() { return "bla"; };
  });
  ```

  In that case the protoype is an anonymous class, i.e. it won't have a meaningful name in the debugger.

  To overcome this you can give the prototype function a name:

  ```
  function Foo() {
    Foo.super.apply(this, arguments);
  }
  MyClass.extend(Foo, function FooPrototype() {
    this.bla = function() { return "bla"; };
  });
  ```

  #### Static variables

  Static variables can either be set directly on the `static` scope:

  ```
  var Foo = MyClass.extend();
  Foo.static.foo = "foo"
  ```

  Or with a prototype you can provide them in a `static` object property of the prototype:

  ```
  MyClass.extend({
    static: {
      foo: "foo"
    }
  });
  MyClass.static.foo -> "foo"
  ```

  A static scope of a class comes with a reference to its owning class. I.e.,

  ```
  MyClass.static.__class__
  ```

  Gives gives access to `MyClass`.


  #### Mix-ins

  Mixins must be plain objects. They get merged into the created prototype.

  ```
  var MyMixin = {
    foo: "foo";
  };
  function Foo() {
    Foo.super.apply(this, arguments);
  }
  MyClass.extend(Foo, MyMixin);
  ```

  This is also possible in combination with prototype functions.

  ```
  var MyMixin = {
    foo: "foo";
    bar: "bar";
  };
  function Foo() {
    Foo.super.apply(this, arguments);
  }
  MyClass.extend(Foo, MyMixin, function() {
    this.bar = "this wins"
  });
  ```
  Mixins never override existing prototype functions, or already other mixed in members.

*/
oo.initClass = function(clazz) {
  _initClass(clazz);
  _makeExtensible(clazz);
};

/**
 * Inherit from a parent class.
 *
 * @param {Constructor} clazz class constructor
 * @param {Constructor} parentClazz parent constructor
 *
 * @example
 *
 * ```js
 * var oo = require('substance/basics/oo');
 * var Parent = function() {};
 * Parent.Prototype = function() {
 *   this.foo = function() { return 'foo'; }
 * }
 * var Child = function() {
 *   Parent.apply(this, arguments);
 * }
 * oo.inherit(Child, Parent);
 * ```
 */
oo.inherit =  function(clazz, parentClazz) {
  if (!clazz.__is_initialized__) {
    oo.initClass(clazz);
  }
  _inherit(clazz, parentClazz);
  _afterClassInitHook(clazz);
};

/*
 * @param clazz {Constructor} class constructor
 * @param mixinClazz {Constructor} parent constructor
 */
oo.mixin = function(Clazz, mixin) {
  if (!Clazz.__is_initialized__) {
    oo.initClass(Clazz);
  }
  _mixin(Clazz, mixin);
};

// ### Internal implementations

function _initClass(clazz) {
  if (clazz.__is_initialized__) return;
  if (clazz.Prototype && !(clazz.prototype instanceof clazz.Prototype)) {
    clazz.prototype = new clazz.Prototype();
    clazz.prototype.constructor = clazz;
  }
  var StaticScope = _StaticScope();
  clazz.static = clazz.static || new StaticScope(clazz);
  clazz.__is_initialized__ = true;
}

function _inherit(ChildClass, ParentClass) {
  if (ChildClass.prototype instanceof ParentClass) {
    throw new Error('Target already inherits from origin');
  }
  // Customization: supporting a prototype constructor function
  // defined as a static member 'Prototype' of the target function.
  var PrototypeCtor = ChildClass.Prototype;
  // Provide a shortcut to the parent constructor
  ChildClass.super = ParentClass;
  if (PrototypeCtor) {
    PrototypeCtor.prototype = ParentClass.prototype;
    ChildClass.prototype = new PrototypeCtor();
    ChildClass.prototype.constructor = ChildClass;
  } else {
    ChildClass.prototype = Object.create(ParentClass.prototype, {
      // Restore constructor property of clazz
      constructor: {
        value: ChildClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  }
  // provide a shortcut to the parent prototype
  ChildClass.prototype.super = ParentClass.prototype;
  // Extend static properties - always initialize both sides
  var StaticScope = _StaticScope();
  if (ParentClass.static) {
    StaticScope.prototype = ParentClass.static;
  }
  ChildClass.static = new StaticScope(ChildClass);
  if (ChildClass.static._makeExtendFunction) {
    ChildClass.extend = ChildClass.static._makeExtendFunction(ChildClass);
  } else {
    _makeExtensible(ChildClass);
  }
}

function _afterClassInitHook(childClazz) {
  var proto = childClazz.prototype;
  for(var key in proto) {
    if (key === "constructor" ||
        key === "__class__" ||
        !proto.hasOwnProperty(key)) continue;
    // built-in: extend class.static with prototype.static
    if (key === 'static') {
      _copyStaticProps(childClazz.static, proto.static);
      continue;
    }
  }
}

/*
  extend() -> lazy inheritance without a proto
  extend({...}) -> lazy inheritance with a proto
  extend(Function) -> inheritance without a proto
  extend(Function, {}) -> inherit with a proto
  extend(Function, Function) -> inheritance with prototype function
*/
function _extendClass(ParentClass) {

  // this ctor is used when extend is not provided with a constructor function.
  function AnonymousClass() {
    ParentClass.apply(this, arguments);
  }

  var args = Array.prototype.slice.call(arguments, 1);
  //var childOrProto = args[args.length-1];
  var ChildClass;
  var mixins = [];

  // the first argument must be a Class constructor, otherwise we will use an anonymous ctor.
  var idx = 0;
  if (isFunction(args[0])) {
    ChildClass = args[0];
    idx++;
  } else {
    ChildClass = AnonymousClass;
  }
  // the remaining arguments should be Objects used as a mixin for the created prototype
  // the last argument may be a prototype constructor function.
  for (; idx < args.length; idx++) {
    if (isFunction(args[idx])) {
      if (idx !== args.length-1) {
        throw new Error('Illegal use of Class.extend(): Prototype function must be last argument.');
      }
      if (ChildClass.hasOwnProperty('Prototype')) {
        throw new Error('Class ' + ChildClass.name + ' has defined ' + ChildClass.name +
         '.Prototype which would be overwritten by Class.extend().\n' +
         'You provided a prototype function when calling Class.extend().');
      } else {
        ChildClass.Prototype = args[idx];
      }
      break;
    } else if (isObject(args[idx])) {
      mixins.push(args[idx]);
    } else {
      throw new Error('Illegal use of Class.extend');
    }
  }
  _inherit(ChildClass, ParentClass);

  // from right to left copy all mixins into the prototype
  // but never overwrite
  // like with lodash/object/extend, the mixin later in the args list 'wins'
  for (var i = mixins.length - 1; i >= 0; i--) {
    _mixin(ChildClass, mixins[i]);
  }

  return ChildClass;
}

function _mixin(Clazz, mixin) {
  var proto = Clazz.prototype;
  for(var key in mixin) {
    if (mixin.hasOwnProperty(key)) {
      // built-in: extend class.static with prototype.static
      if (key === 'static') {
        _copyStaticProps(Clazz.static, mixin.static);
        continue;
      } else {
        if (!proto.hasOwnProperty(key)) {
          proto[key] = mixin[key];
        }
      }
    }
  }
}

function _makeExtensible(clazz) {
  if (!clazz.static) {
    oo.initClass(clazz);
  }
  clazz.static._makeExtendFunction = function(parentClazz) {
    return bind(_extendClass, clazz, parentClazz);
  };
  clazz.extend = clazz.static._makeExtendFunction(clazz);
}

oo.makeExtensible = _makeExtensible;

function _StaticScope() {
  return function StaticScope(clazz) {
    this.__class__ = clazz;
  };
}

function _copyStaticProps(staticProps, parentStaticProps) {
  for ( var key in parentStaticProps ) {
    if ( key === 'constructor' ||
         key === '__class__' ||
         !parentStaticProps.hasOwnProperty( key ) ||
         // don't overwrite static properties
         staticProps.hasOwnProperty(key) ) {
      continue;
    }
    staticProps[key] = parentStaticProps[key];
  }
}

module.exports = oo;
