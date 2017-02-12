import isArrayEqual from '../util/isArrayEqual'
import Coordinate from './Coordinate'

/*
  Adapter for Coordinate oriented implementations.
  E.g. Coordinate transforms can be applied to update selections
  using OT.

  @internal
*/
class CoordinateAdapter extends Coordinate {

  constructor(owner, pathProperty, offsetProperty) {
    super('SKIP')

    this._owner = owner;
    this._pathProp = pathProperty;
    this._offsetProp = offsetProperty;
    Object.freeze(this);
  }

  equals(other) {
    return (other === this ||
      (isArrayEqual(other.path, this.path) && other.offset === this.offset) )
  }

  get path() {
    return this._owner[this._pathProp];
  }

  set path(path) {
    this._owner[this._pathProp] = path;
  }

  get offset() {
    return this._owner[this._offsetProp];
  }

  set offset(offset) {
    this._owner[this._offsetProp] = offset;
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
}

export default CoordinateAdapter