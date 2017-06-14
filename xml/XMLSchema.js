import { forEach, last } from '../util'
import DFA from './DFA'

const { TEXT, EPSILON, START } = DFA

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

  // EXPERIMENTAL:
  // we want to provide a high-level API `node.append()`
  // which looks for the last valid position according to the element schema
  findLastValidPos(el, tagName) {
    let candidates = _findInsertPosCandidates(this.dfa, el, tagName)
    if (candidates.length > 0) {
      return last(candidates)
    } else {
      return -1
    }
  }

}

function _findInsertPosCandidates(dfa, el, newType) {
  let candidates = []
  let state = START
  let children = el.getChildren()
  let pos = 0
  for (;pos < children.length; pos++) {
    const child = children[pos]
    if (dfa.canConsume(state, newType)) {
      candidates.push(pos)
    }
    let nextState = dfa.consume(state, child.tagName)
    if (nextState === -1) {
      throw new Error('Element is invalid:', el.toXML())
    }
    state = nextState
  }
  // also consider the position after all previous siblings
  if (dfa.canConsume(state, newType)) {
    candidates.push(pos)
  }
  return candidates
}