import { forEach, map } from '../util'
import { Expression } from './RegularLanguage'
import DFA from './DFA'

const { TEXT } = DFA

export default class XMLSchema {

  constructor(elementSchemas, startElement) {
    if (!elementSchemas[startElement]) {
      throw new Error('startElement must be a valid element.')
    }
    this._elementSchemas = {}
    this.startElement = startElement
    // wrap schemas into ElementSchemas
    forEach(elementSchemas, (spec, name) => {
      this._elementSchemas[name] = new ElementSchema(spec.name, spec.type, spec.attributes, spec.expr)
    })
  }

  getTagNames() {
    return Object.keys(this._elementSchemas)
  }

  getElementSchema(name) {
    return this._elementSchemas[name]
  }

  getStartElement() {
    return this.startElement
  }

  toJSON() {
    let result = {
      start: this.getStartElement(),
      elements: {}
    }
    forEach(this._elementSchemas, (schema, name) => {
      result.elements[name] = schema.toJSON()
    })
    return result
  }

  // prints out a Markdown representation of the schema
  toMD() {
    let result = []
    let elementNames = Object.keys(this._elementSchemas)
    elementNames.sort()
    elementNames.forEach((name) => {
      let elementSchema = this._elementSchemas[name]
      result.push(`# <${elementSchema.name}>`)
      result.push('\n')
      result.push(`type: ${elementSchema.type}`)
      result.push('attributes: '+ map(elementSchema.attributes, (_, name) => { return name }).join(', '))
      result.push('children:')
      result.push('  ', elementSchema.expr.toString())
      result.push('\n')
    })
    return result.join('\n')
  }
}

XMLSchema.fromJSON = function(data) {
  let elementSchemas = {}
  forEach(data.elements, (elData) => {
    let elSchema = ElementSchema.fromJSON(elData)
    elementSchemas[elSchema.name] = elSchema
  })
  return new XMLSchema(elementSchemas, data.start)
}

class ElementSchema {

  constructor(name, type, attributes, expr) {
    this.name = name
    this.type = type
    this.attributes = attributes
    this.expr = expr

    if (!name) {
      throw new Error("'name' is mandatory")
    }
    if (!type) {
      throw new Error("'type' is mandatory")
    }
    if (!attributes) {
      throw new Error("'attributes' is mandatory")
    }
    if (!expr) {
      throw new Error("'expr' is mandatory")
    }
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type,
      attributes: this.attributes,
      elements: this.expr.toJSON()
    }
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

ElementSchema.fromJSON = function(data) {
  return new ElementSchema(
    data.name,
    data.type,
    data.attributes,
    Expression.fromJSON(data.elements)
  )
}