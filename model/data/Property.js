import isArray from '../../util/isArray'
import last from '../../util/last'
import Coordinate from '../Coordinate'

/*
  Internal helper class used by model/data/Node.
*/
export default class Property {

  constructor(spec) {
    Object.assign(this, spec)
  }

  isArray() {
    return isArray(this.type)
  }

  isReference() {
    if (this.isArray()) {
      return last(this.type) === 'id'
    } else {
      return this.type === 'id'
    }
  }

  isOwned() {
    return Boolean(this.owned)
  }

  hasDefault() {
    return this.hasOwnProperty('default')
  }

  createDefaultValue() {
    if (isArray(this.type)) {
      return []
    }
    switch(this.type) {
      case 'object':
        return {}
      case 'number':
        return -1
      case 'coordinate':
        return new Coordinate([], 0)
      case 'boolean':
        return false
      case 'id':
        return null
      case 'string':
        return ''
      default:
        return null
    }
  }
}
