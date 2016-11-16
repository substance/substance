import isArrayEqual from '../util/isArrayEqual'

/*
  Adapter for Coordinate oriented implementations.
  E.g. Coordinate transforms can be applied to update selections
  using OT.

  @internal
*/
class CoordinateAdapter {

  constructor(owner, pathProperty, offsetProperty) {
    this._owner = owner;
    this._pathProp = pathProperty;
    this._offsetProp = offsetProperty;
    Object.freeze(this);
  }

  equals(other) {
    return (other === this ||
      (isArrayEqual(other.path, this.path) && other.offset === this.offset) )
  }

  getNodeId() {
    return this.path[0]
  }

  getPath() {
    return this.path
  }

  getOffset() {
    return this.offset
  }

  toJSON() {
    return {
      path: this.path,
      offset: this.offset
    }
  }

  toString() {
    return "(" + this.path.join('.') + ", " + this.offset + ")"
  }

  isPropertyCoordinate() {
    return this.path.length > 1
  }

  isNodeCoordinate() {
    return this.path.length === 1
  }
}

CoordinateAdapter.prototype._isCoordinate = true

Object.defineProperties(CoordinateAdapter.prototype, {
  path: {
    get: function() {
      return this._owner[this._pathProp];
    },
    set: function(path) {
      this._owner[this._pathProp] = path;
    }
  },
  offset: {
    get: function() {
      return this._owner[this._offsetProp];
    },
    set: function(offset) {
      this._owner[this._offsetProp] = offset;
    }
  }
})

export default CoordinateAdapter