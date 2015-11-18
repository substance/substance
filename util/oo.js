/* jshint latedef:nofunc */

'use strict';

var extend = require('lodash/object/extend');

/**
 * Helpers for oo programming.
 *
 * @module
 */
var oo = {};

var defaultStaticProps = {'name': true, 'displayName': true};

/**
 * Initialize a class.
 *
 * @param {Constructor} clazz
 */
oo.initClass = function(clazz) {
  _initClass(clazz);
  _makeExtensible(clazz, defaultStaticProps);
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
  if (clazz.static._afterClassInitHook) {
    clazz.static._afterClassInitHook(clazz);
  }
};

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
         clazz.hasOwnProperty(key) ) {
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
  if (clazz.Prototype && !(clazz.prototype instanceof clazz.Prototype)) {
    clazz.prototype = new clazz.Prototype();
    clazz.prototype.constructor = clazz;
  }
  var StaticScope = _StaticScope();
  clazz.static = clazz.static || new StaticScope(clazz);
  clazz.__is_initialized__ = true;
}

function _inherit(clazz, parentClazz) {
  if (clazz.prototype instanceof parentClazz) {
    throw new Error('Target already inherits from origin');
  }
  var targetConstructor = clazz.prototype.constructor;
  // Customization: supporting a prototype constructor function
  // defined as a static member 'Prototype' of the target function.
  var TargetPrototypeCtor = clazz.Prototype;
  // Provide a shortcut to the parent constructor
  clazz.super = parentClazz;
  if (TargetPrototypeCtor) {
    TargetPrototypeCtor.prototype = parentClazz.prototype;
    clazz.prototype = new TargetPrototypeCtor();
    clazz.prototype.constructor = clazz;
  } else {
    clazz.prototype = Object.create(parentClazz.prototype, {
      // Restore constructor property of clazz
      constructor: {
        value: targetConstructor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  }
  // provide a shortcut to the parent prototype
  clazz.prototype.super = parentClazz.prototype;
  // Extend static properties - always initialize both sides
  var StaticScope = _StaticScope();
  if (parentClazz.static) {
    StaticScope.prototype = parentClazz.static;
  }
  clazz.static = new StaticScope(clazz);
  if (clazz.static._makeExtendFunction) {
    clazz.extend = clazz.static._makeExtendFunction(clazz);
  } else {
    _makeExtensible(clazz, defaultStaticProps);
  }
}

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

function _extendClass(parent, staticProps, afterHook, proto) {
  console.warn('DEPRECATED: oo.extend() will be dropped. It is going into a wrong direction considering ES6. Instead you should take the oo.inherit() approach.');
  if (arguments.length > 4) {
    var args = Array.prototype.slice.call(arguments, 3);
    args.unshift({});
    proto = extend.apply(null, args);
  } else if (arguments.length === 3) {
    proto = {};
  }
  var Constructor = function ExtendedClass() {
    // this.__className__ = proto.displayName || proto.name;
    parent.apply(this, arguments);
    if (this.init) {
      console.log('DEPRECATED: we want to drop this built-in hook in favor of a custom hook.');
      this.init.apply(this, arguments);
    }
  };
  if (proto.displayName) {
    Constructor.displayName = proto.displayName;
  } else if (proto.name) {
    Constructor.displayName = proto.name;
  }
  // calling 'silently' so that afterHook doesn't get called too early
  _inherit(Constructor, parent);
  for(var key in proto) {
    if (proto.hasOwnProperty(key)) {
      // built-in: extend class.static with prototype.static
      if (key === 'static') {
        extend(Constructor.static, proto.static);
        continue;
      }
      if (key in staticProps) {
        Constructor.static[key] = proto[key];
      } else {
        Constructor.prototype[key] = proto[key];
      }
    }
  }
  if (afterHook) {
    afterHook(Constructor, proto);
  }
  return Constructor;
}

function _makeExtensible(clazz, staticProps, afterHook) {
  staticProps = staticProps || {};
  if (!clazz.static) {
    oo.initClass(clazz);
  }
  clazz.static._makeExtendFunction = function(parentClazz) {
    return _extendClass.bind(null, parentClazz, staticProps, afterHook);
  };
  // add a hook that moves static properties to clazz.static
  clazz.static._afterClassInitHook = function(childClazz) {
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
      // move over all static properties to class.static
      if (proto.hasOwnProperty(key)) {
        if (key in staticProps) {
          childClazz.static[key] = proto[key];
        }
      }
    }
    if (afterHook) {
      afterHook(childClazz);
    }
  };
  clazz.extend = clazz.static._makeExtendFunction(clazz);
}

oo.makeExtensible = _makeExtensible;


module.exports = oo;
