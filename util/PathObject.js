import isString from './isString'
import isArray from './isArray'
import get from 'lodash-es/get'
import setWith from 'lodash-es/setWith'
import unset from 'lodash-es/unset'

/*
  An object that can be access via path API.

  @example

  var obj = new PathObject({a: "aVal", b: {b1: 'b1Val', b2: 'b2Val'}})
*/

class PathObject {

  /*
    @param {object} [root] An object to operate on
  */
  constructor(root) {
    if (root) {
      this.__root__ = root
    }
  }

  contains(id) {
    return Boolean(this.getRoot()[id])
  }

  getRoot() {
    if (this.__root__) {
      return this.__root__
    } else {
      return this
    }
  }

  /**
    Get value at path

    @return {object} The value stored for a given path

    @example

    obj.get(['b', 'b1'])
    => b1Val
  */
  get(path) {
    if (!path) {
      return undefined
    }
    if (isString(path)) {
      return this.getRoot()[path]
    }
    if (arguments.length > 1) {
      path = Array.prototype.slice(arguments, 0)
    }
    if (!isArray(path)) {
      throw new Error('Illegal argument for PathObject.get()')
    }
    return get(this.getRoot(), path)
  }

  set(path, value) {
    if (!path) {
      throw new Error('Illegal argument: PathObject.set(>path<, value) - path is mandatory.')
    }
    if (isString(path)) {
      this.getRoot()[path] = value
    } else {
      setWith(this.getRoot(), path, value)
    }
  }

  delete(path) {
    if (isString(path)) {
      delete this.getRoot()[path]
    } else if (path.length === 1) {
      delete this.getRoot()[path[0]]
    } else {
      var success = unset(this.getRoot(), path)
      if (!success) {
        throw new Error('Could not delete property at path' + path)
      }
    }
  }

  clear() {
    var root = this.getRoot()
    for (var key in root) {
      if (root.hasOwnProperty(key)) {
        delete root[key]
      }
    }
  }

}

PathObject.prototype._isPathObject = true

export default PathObject
