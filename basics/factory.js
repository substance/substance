'use strict';

var OO = require('./oo');
var Registry = require('./registry');

/**
 * Factory
 * -------
 * Simple factory implementation.
 *
 * @class Factory
 * @extends Registry
 * @constructor
 * @module Basics
 */
function Factory() {
  Factory.super.call(this);
}

Factory.Prototype = function() {

  /**
   * Create an instance of the clazz with a given name.
   *
   * @param {String} name
   * @return A new instance.
   * @method create
   */
  this.create = function ( name ) {
    var clazz = this.get(name);
    if ( !clazz ) {
      throw new Error( 'No class registered by that name: ' + name );
    }
    // call the clazz providing the remaining arguments
    var args = Array.prototype.slice.call( arguments, 1 );
    var obj = Object.create( clazz.prototype );
    clazz.apply( obj, args );
    return obj;
  };

};

OO.inherit(Factory, Registry);

module.exports = Factory;
