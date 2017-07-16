import { forEach, last } from '../util'
import DFA from './DFA'

const { TEXT, EPSILON, START } = DFA

export default class XMLSchema {

  constructor(elementSchemas) {
    this._elementSchemas = {}
    forEach(elementSchemas, (spec, name) => {
      this._elementSchemas[name] = new ElementSchema(this, spec)
    })
  }

  getTagNames() {
    return Object.keys(this._elementSchemas)
  }

  getElementSchema(name) {
    return this._elementSchemas[name]
  }

  getStartElement() {
    // TODO: we should extract this from RNG
    // for now you must override this method
    throw new Error('This method is abstract')
  }
}

class ElementSchema {

  constructor(xmlSchema, { name, type, attributes, expr}) {
    this.xmlSchema = xmlSchema
    this.name = name
    this.type = type
    this.attributes = attributes
    this.expr = expr
  }

  isAllowed(tagName) {
    return this.expr.isAllowed(tagName)
  }

  isTextAllowed() {
    return this.expr.isAllowed(TEXT)
  }

  printStructure() {
    return `${this.name} ::= ${this.expr.toString()}`
  }

  findFirstValidPos(el, newTag) {
    return this.expr._findInsertPos(el, newTag, 'first')
  }

  findLastValidPos(el, newTag) {
    return this.expr._findInsertPos(el, newTag, 'last')
  }

}
