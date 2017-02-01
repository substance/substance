import isArray from '../../util/isArray'
import last from '../../util/last'
import Coordinate from '../Coordinate'

/*
  Internal helper class used by model/data/Node.
*/
export default class Property {

  constructor(definition) {
    this.definition = definition
  }

  isArray() {
    return isArray(this.definition.type)
  }

  isReference() {
    if (this.isArray()) {
      return last(this.definition.type) === 'id'
    } else {
      return this.definition.type === 'id'
    }
  }

  isText() {
    return Boolean(this.definition._isText)
  }

  isOwned() {
    return Boolean(this.definition.owned)
  }

  isOptional() {
    return Boolean(this.definition.optional)
  }

  isNotNull() {
    return Boolean(this.definition.notNull)
  }

  hasDefault() {
    return this.definition.hasOwnProperty('default')
  }

  getDefault() {
    return this.definition.default
  }

  createDefaultValue() {
    if (isArray(this.definition.type)) {
      return []
    }
    switch(this.definition.type) {
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

  get type() {
    return this.definition.type
  }

  get name() {
    return this.definition.name
  }
}
