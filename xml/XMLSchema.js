import { forEach } from '../util'
import DFA from './DFA'

const { TEXT, EPSILON } = DFA

export default class XMLSchema {

  constructor(elementSchemas) {
    this._elementSchemas = {}
    forEach(elementSchemas, (spec, name) => {
      this._elementSchemas[name] = new ElementSchema(spec)
    })
  }

  getTagNames() {
    return Object.keys(this._elementSchemas)
  }

  getElementSchema(name) {
    return this._elementSchemas[name]
  }
}

class ElementSchema {

  constructor({name, type, attributes, dfa}) {
    this.name = name
    this.type = type
    this.attributes = attributes
    this.dfa = dfa

    this._initialize()
  }

  // EXPERIMENTAL: reflection API which is used
  // to inhibit commands considering the current
  // selection state
  // This works only for ContainerNodes and TextNodes
  // where order on the children is not restricted

  _initialize() {
    // Note: collecting all children
    const children = {}
    forEach(this.dfa.transitions, (T) => {
      Object.keys(T).forEach((tagName) => {
        if (tagName === TEXT || tagName === EPSILON) return
        children[tagName] = true
      })
    })
    this._allowedChildren = children
  }

  isAllowed(tagName) {
    return Boolean(this._allowedChildren[tagName])
  }

}