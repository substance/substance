import { get, setWith } from 'lodash-es'
import isString from './isString'
import isArray from './isArray'
import deleteFromArray from './deleteFromArray'

class TreeNode {}

/*
 * A tree-structure for indexes.
 */
export default class TreeIndex {
  /**
   * Get value at path.
   *
   * @return {object} The value stored for a given path
   *
   * @example
   *
   * obj.get(['b', 'b1']);
   * => b1Val
   */
  get (path) {
    if (arguments.length > 1) {
      path = Array.prototype.slice(arguments, 0)
    }
    path = _pathify(path)
    return get(this, path)
  }

  getAll (path) {
    if (arguments.length > 1) {
      path = Array.prototype.slice(arguments, 0)
    }
    path = _pathify(path)
    if (!isArray(path)) {
      throw new Error('Illegal argument for TreeIndex.get()')
    }
    let node = get(this, path)
    return this._collectValues(node)
  }

  set (path, value) {
    path = _pathify(path)
    setWith(this, path, value, function (val) {
      if (!val) return new TreeNode()
    })
  }

  delete (path) {
    path = _pathify(path)
    if (path.length === 1) {
      delete this[path[0]]
    } else {
      let key = path[path.length - 1]
      path = path.slice(0, -1)
      let parent = get(this, path)
      if (parent) {
        delete parent[key]
      }
    }
  }

  clear () {
    let root = this
    for (let key in root) {
      if (root.hasOwnProperty(key)) {
        delete root[key]
      }
    }
  }

  traverse (fn) {
    this._traverse(this, [], fn)
  }

  forEach (...args) {
    this.traverse(...args)
  }

  _traverse (root, path, fn) {
    let id
    for (id in root) {
      if (!root.hasOwnProperty(id)) continue
      let child = root[id]
      let childPath = path.concat([id])
      if (child instanceof TreeNode) {
        this._traverse(child, childPath, fn)
      } else {
        fn(child, childPath)
      }
    }
  }

  _collectValues (root) {
    // TODO: don't know if this is the best solution
    // We use this only for indexes, e.g., to get all annotation on one node
    let vals = {}
    this._traverse(root, [], function (val, path) {
      let key = path[path.length - 1]
      vals[key] = val
    })
    return vals
  }
}

function _pathify (path) {
  if (isString(path)) {
    return [path]
  } else {
    return path
  }
}

class TreeIndexArrays extends TreeIndex {
  contains (path) {
    let val = super.get(path)
    return Boolean(val)
  }

  get (path) {
    let val = super.get(path)
    if (val instanceof TreeNode) {
      val = val.__values__ || []
    }
    return val
  }

  set (path, arr) {
    let val = super.get(path)
    val.__values__ = arr
  }

  add (path, value) {
    path = _pathify(path)
    if (!isArray(path)) {
      throw new Error('Illegal arguments.')
    }
    let arr

    // We are using setWith, as it allows us to create nodes on the way down
    // setWith can be controlled via a hook called for each key in the path
    // If val is not defined, a new node must be created and returned.
    // If val is defined, then we must return undefined to keep the original tree node
    // __dummy__ is necessary as setWith is used to set a value, but we want
    // to append to the array
    setWith(this, path.concat(['__values__', '__dummy__']), undefined, function (val, key) {
      if (key === '__values__') {
        if (!val) val = []
        arr = val
      } else if (!val) {
        val = new TreeNode()
      }
      return val
    })
    delete arr.__dummy__
    arr.push(value)
  }

  remove (path, value) {
    let arr = get(this, path)
    if (arr instanceof TreeNode) {
      if (arguments.length === 1) {
        delete arr.__values__
      } else {
        deleteFromArray(arr.__values__, value)
      }
    }
  }

  _collectValues (root) {
    let vals = []
    this._traverse(root, [], function (val) {
      vals.push(val)
    })
    vals = Array.prototype.concat.apply([], vals)
    return vals
  }
}

TreeIndex.Arrays = TreeIndexArrays
