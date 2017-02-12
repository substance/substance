import get from 'lodash-es/get'
import setWith from 'lodash-es/setWith'
import isString from './isString'
import isArray from './isArray'
import deleteFromArray from './deleteFromArray'

class TreeNode {}

/*
 * A tree-structure for indexes.
 *
 * @class TreeIndex
 * @param {object} [obj] An object to operate on
 * @memberof module:Basics
 * @example
 *
 * var index = new TreeIndex({a: "aVal", b: {b1: 'b1Val', b2: 'b2Val'}});
 */

class TreeIndex {
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
  get(path) {
    if (arguments.length > 1) {
      path = Array.prototype.slice(arguments, 0);
    }
    if (isString(path)) {
      path = [path];
    }
    return get(this, path);
  }

  getAll(path) {
    if (arguments.length > 1) {
      path = Array.prototype.slice(arguments, 0);
    }
    if (isString(path)) {
      path = [path];
    }
    if (!isArray(path)) {
      throw new Error('Illegal argument for TreeIndex.get()');
    }
    var node = get(this, path);
    return this._collectValues(node);
  }

  set(path, value) {
    if (isString(path)) {
      path = [path];
    }
    setWith(this, path, value, function(val) {
      if (!val) return new TreeNode();
    });
  }

  delete(path) {
    if (isString(path)) {
      delete this[path];
    } else if(path.length === 1) {
      delete this[path[0]];
    } else {
      var key = path[path.length-1];
      path = path.slice(0, -1);
      var parent = get(this, path);
      if (parent) {
        delete parent[key];
      }
    }
  }

  clear() {
    var root = this;
    for (var key in root) {
      if (root.hasOwnProperty(key)) {
        delete root[key];
      }
    }
  }

  traverse(fn) {
    this._traverse(this, [], fn);
  }

  forEach(...args) {
    this.traverse(...args)
  }

  _traverse(root, path, fn) {
    var id;
    for (id in root) {
      if (!root.hasOwnProperty(id)) continue;
      var child = root[id];
      var childPath = path.concat([id]);
      if (child instanceof TreeNode) {
        this._traverse(child, childPath, fn);
      } else {
        fn(child, childPath);
      }
    }
  }

  _collectValues(root) {
    // TODO: don't know if this is the best solution
    // We use this only for indexes, e.g., to get all annotation on one node
    var vals = {};
    this._traverse(root, [], function(val, path) {
      var key = path[path.length-1];
      vals[key] = val;
    });
    return vals;
  }
}

class TreeIndexArrays extends TreeIndex {

  contains(path) {
    let val = super.get(path)
    return Boolean(val)
  }

  get(path) {
    let val = super.get(path)
    if (val instanceof TreeNode) {
      val = val.__values__ || [];
    }
    return val;
  }

  set(path, arr) {
    let val = super.get(path)
    val.__values__ = arr
  }

  add(path, value) {
    if (isString(path)) {
      path = [path];
    }
    if (!isArray(path)) {
      throw new Error('Illegal arguments.');
    }
    var arr;

    // We are using setWith, as it allows us to create nodes on the way down
    // setWith can be controlled via a hook called for each key in the path
    // If val is not defined, a new node must be created and returned.
    // If val is defined, then we must return undefined to keep the original tree node
    // __dummy__ is necessary as setWith is used to set a value, but we want
    // to append to the array
    setWith(this, path.concat(['__values__','__dummy__']), undefined, function(val, key) {
      if (key === '__values__') {
        if (!val) val = [];
        arr = val;
      } else if (!val) {
        val = new TreeNode();
      }
      return val;
    })
    delete arr.__dummy__
    arr.push(value)
  }

  remove(path, value) {
    var arr = get(this, path);
    if (arr instanceof TreeNode) {
      if (arguments.length === 1) {
        delete arr.__values__
      } else {
        deleteFromArray(arr.__values__, value);
      }
    }
  }

  _collectValues(root) {
    var vals = []
    this._traverse(root, [], function(val) {
      vals.push(val);
    })
    vals = Array.prototype.concat.apply([], vals)
    return vals
  }
}

TreeIndex.Arrays = TreeIndexArrays

export default TreeIndex;
