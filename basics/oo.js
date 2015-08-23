'use strict';

var _ = require('./helpers');

/**
 * Helpers for OO programming.
 *
 * Inspired by VisualEditor's OO module.
 *
 * @class OO
 * @static
 * @module Basics
 */
var OO = {};

var extend = function( parent, proto ) {
  var Constructor = function ExtendedClass() {
    this.__className__ = proto.displayName || proto.name;
    parent.apply(this, arguments);
    if (this.init) {
      this.init.apply(this, arguments);
    }
  };
  if (proto.displayName) {
    Constructor.displayName = proto.displayName;
  } else if (proto.name) {
    Constructor.displayName = proto.name;
  }
  OO.inherit(Constructor, parent);
  for(var key in proto) {
    if (proto.hasOwnProperty(key)) {
      if (key === "name") {
        continue;
      }
      Constructor.prototype[key] = proto[key];
    }
  }
  Constructor.static.name = proto.name;
  return Constructor;
};

/**
 * Initialize a class.
 *
 * @param {Constructor} clazz
 * @method initClass
 */
OO.initClass = function(clazz) {
  if (clazz.Prototype && !(clazz.prototype instanceof clazz.Prototype)) {
    clazz.prototype = new clazz.Prototype();
    clazz.prototype.constructor = clazz;
  }
  clazz.static = clazz.static || {};
  clazz.extend = clazz.extend || _.bind(extend, null, clazz);
};

/**
 * Inherit from a parent class.
 *
 * @param clazz {Constructor} class constructor
 * @param parentClazz {Constructor} parent constructor
 *
 * @method inherit
 */
OO.inherit =  function(clazz, parentClazz) {
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
  OO.initClass( parentClazz );
  clazz.static = Object.create(parentClazz.static);
  clazz.extend = _.bind(extend, null, clazz);
};

/**
 * @param clazz {Constructor} class constructor
 * @param mixinClazz {Constructor} parent constructor
 * @method mixin
 */
OO.mixin = function(clazz, mixinClazz) {
  var key;
  var prototype = mixinClazz.prototype;
  if (mixinClazz.Prototype) {
    prototype = new mixinClazz.Prototype();
  }
  // Copy prototype properties
  for ( key in prototype ) {
    if ( key !== 'constructor' && prototype.hasOwnProperty( key ) ) {
      clazz.prototype[key] = prototype[key];
    }
  }
  // make sure the clazz is initialized
  OO.initClass(clazz);
  // Copy static properties
  if ( mixinClazz.static ) {
    for ( key in mixinClazz.static ) {
      if ( mixinClazz.static.hasOwnProperty( key ) ) {
        clazz.static[key] = mixinClazz.static[key];
      }
    }
  } else {
    OO.initClass(mixinClazz);
  }
};

module.exports = OO;
