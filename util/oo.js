'use strict';

import isObject from 'lodash/isObject'
import isFunction from 'lodash/isFunction'

/**
 * Helpers for oo programming.
 *
 * @module
 */
var oo = {};

/**
  Initialize a class.

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

  The preferred way is to extend a subclass this way:

  ```
  function Foo() {
    Foo.super.apply(this, arguments);
  }
  MyClass.extend(Foo);
  ```

  In ES6 this would be equivalent too

  ```
  class Foo extends MyClass {}
  ```
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
 * import oo from 'substance/basics/oo'
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
oo.inherit = function(clazz, parentClazz) {
  if (!clazz.__is_initialized__) {
    oo.initClass(clazz);
  }
  _inherit(clazz, parentClazz);
  _afterClassInitHook(clazz);
};

oo.inherits = oo.inherit;

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
  // legacy: formerly we had a static scope on each
  // class which has been removed
  // Now, static properties are copied, as they were final static
  Object.defineProperties(clazz.prototype, {
    'static': {
      enumerable: false,
      configurable: true,
      get: function() { return clazz; }
    }
  });
  _makeExtensible(clazz);
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
    PrototypeCtor.prototype = Object.create(ParentClass.prototype, {
      // Restore constructor property of clazz
      constructor: {
        value: PrototypeCtor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
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
  // provide a shortcut to the parent class
  // ChildClass.prototype.super = ParentClass;
  // Extend static properties - always initialize both sides
  _copyStaticProperties(ChildClass, ParentClass);
  _makeExtensible(ChildClass);
  ChildClass.__is_initialized__ = true;
}

function _copyStaticProperties(ChildClass, ParentClass) {
  // console.log('_copyStaticProperties', ChildClass, ParentClass);
  for (var prop in ParentClass) {
    if (!ParentClass.hasOwnProperty(prop)) continue;
    if (prop === 'Prototype' ||
        prop === 'super' ||
        prop === 'extend' ||
        prop === 'name' ||
        prop === '__is_initialized__') continue;
    // console.log('.. copying property "%s"', prop);
    ChildClass[prop] = ParentClass[prop];
  }
}

function _afterClassInitHook() {
  // obsolete
}

/*
  extend() -> lazy inheritance without a proto
  extend({...}) -> lazy inheritance with a proto
  extend(Function) -> inheritance without a proto
  extend(Function, {}) -> inherit with a proto
  extend(Function, Function) -> inheritance with prototype function
*/
function _extendClass() {
  var ParentClass = this; // eslint-disable-line
  // this ctor is used when extend is not provided with a constructor function.
  function AnonymousClass() {
    ParentClass.apply(this, arguments);
    if (this.initialize) {
      this.initialize();
    }
  }
  var args = arguments;
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
  // like with lodash/extend, the mixin later in the args list 'wins'
  for (var i = mixins.length - 1; i >= 0; i--) {
    _mixin(ChildClass, mixins[i]);
  }

  return ChildClass;
}

function _mixin(Clazz, mixin) {
  var proto = Clazz.prototype;
  for(var key in mixin) {
    if (mixin.hasOwnProperty(key)) {
      if (!proto.hasOwnProperty(key)) {
        proto[key] = mixin[key];
      }
    }
  }
}

function _createExtend(clazz) {
  return function() {
    return _extendClass.apply(clazz, arguments);
  };
}

function _makeExtensible(clazz) {
  // console.log('Adding extend to ', clazz);
  clazz.extend = _createExtend(clazz);
}

oo.makeExtensible = _makeExtensible;

export default oo;
