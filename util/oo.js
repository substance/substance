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
 * Initialize a class.
 *
 * @param {Constructor} clazz
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
 * @param clazz {Constructor} class constructor
 * @param mixinClazz {Constructor} parent constructor
 */
oo.mixin = function(clazz, mixinClazz) {
  if (!clazz.__is_initialized__) {
    oo.initClass(clazz);
  }
  var key;
  var mixinProto = mixinClazz.prototype;
  var classProto = clazz.prototype;
  // Copy prototype properties
  for ( key in mixinProto ) {
    if ( key === 'constructor' ||
         !mixinProto.hasOwnProperty(key) ||
         // don't overwrite existing prototype members
         classProto.hasOwnProperty(key) ) {
      continue;
    }
    classProto[key] = mixinProto[key];
  }
  // Copy static properties
  if ( mixinClazz.static ) {
    _copyStaticProps(clazz.static, mixinClazz.static);
  }
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
      if (ChildClass.hasOwnProperty('Prototype')) {
        throw new Error('Class ' + ChildClass.name + ' has defined ' + ChildClass.name +
         '.Prototype which would be overwritten by Class.extend().\n' +
         'You provided a prototype function when calling Class.extend().');
      } else {
        ChildClass.Prototype = args[idx];
      }
      if (idx < args.length-1) {
        throw new Error('Illegal use of Class.extend(): Prototype function must be last argument.');
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
  var proto = ChildClass.prototype;
  for (var i = mixins.length - 1; i >= 0; i--) {
    var mixin = mixins[i];
    for(var key in mixin) {
      if (mixin.hasOwnProperty(key)) {
        // built-in: extend class.static with prototype.static
        if (key === 'static') {
          _copyStaticProps(ChildClass.static, mixin.static);
          continue;
        } else {
          if (!proto.hasOwnProperty(key)) {
            proto[key] = mixin[key];
          }
        }
      }
    }
  }

  return ChildClass;
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
