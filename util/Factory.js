'use strict';

import Registry from './Registry'

/*
 * Simple factory implementation.
 *
 * @class Factory
 * @extends Registry
 * @memberof module:util
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
   * @memberof module:Basics.Factory.prototype
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

Registry.extend(Factory);

export default Factory;
