import Registry from './Registry'

/*
  Simple factory implementation.

  @class Factory
  @extends Registry
*/
class Factory extends Registry {
  /**
    Create an instance of the clazz with a given name.

    @param {String} name
    @return A new instance.
  */
  create(name) {
    var clazz = this.get(name)
    if (!clazz) {
      throw new Error( 'No class registered by that name: ' + name )
    }
    // call the clazz providing the remaining arguments
    var args = Array.prototype.slice.call( arguments, 1 )
    var obj = Object.create( clazz.prototype )
    clazz.apply( obj, args )
    return obj
  }
}

export default Factory
