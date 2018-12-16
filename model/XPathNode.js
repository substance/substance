import isNumber from '../util/isNumber'

export default class XPathNode {
  constructor (id) {
    this.id = id
    this.prev = null
    this.property = null
    this.pos = null
  }

  toJSON () {
    let data = { id: this.id }
    if (this.property) data.property = this.property
    if (isNumber(this.pos)) data.pos = this.pos
    return data
  }

  toArray () {
    let result = [this.toJSON()]
    let current = this
    while (current.prev) {
      current = current.prev
      result.unshift(current.toJSON())
    }
    return result
  }
}