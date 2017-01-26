import isArray from '../../util/isArray'
import last from '../../util/last'

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

}
