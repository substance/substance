import isArray from '../util/isArray'
import last from '../util/last'
import Coordinate from './Coordinate'

/*
  Internal helper class for schema reflection.
*/
export default class NodeProperty {
  constructor (name, definition) {
    this.name = name
    this.definition = definition

    Object.freeze(this)
    Object.freeze(definition)
  }

  isArray () {
    return isArray(this.definition.type)
  }

  isReference () {
    if (this.isArray()) {
      return last(this.definition.type) === 'id'
    } else {
      return this.definition.type === 'id'
    }
  }

  isText () {
    return Boolean(this.definition._isText)
  }

  isContainer () {
    return Boolean(this.definition._isContainer)
  }

  isOwned () {
    return Boolean(this.definition.owned)
  }

  isOptional () {
    return this.definition.optional || this.hasDefault()
  }

  isNotNull () {
    return Boolean(this.definition.notNull)
  }

  hasDefault () {
    return this.definition.hasOwnProperty('default')
  }

  getDefault () {
    return this.definition.default
  }

  createDefaultValue () {
    if (isArray(this.definition.type)) {
      return []
    }
    switch (this.definition.type) {
      case 'boolean':
        return false
      case 'string':
        return ''
      case 'number':
        return -1
      case 'object':
        return {}
      case 'coordinate':
        return new Coordinate([], 0)
      default:
        return null
    }
  }

  get type () {
    return this.definition.type
  }

  get targetTypes () {
    return this.definition.targetTypes
  }

  get defaultTextType () {
    return this.definition.defaultTextType
  }
}
