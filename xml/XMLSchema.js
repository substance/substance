import forEach from '../util/forEach'
import map from '../util/map'
import { Expression } from './RegularLanguage'
import DFA from './DFA'
import _isTextNodeEmpty from './_isTextNodeEmpty'

const { TEXT } = DFA

export default class XMLSchema {
  constructor (elementSchemas, startElement) {
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

  getIdAttribute () {
    return 'id'
  }

  getTagNames () {
    return Object.keys(this._elementSchemas)
  }

  getElementSchema (name) {
    return this._elementSchemas[name]
  }

  getStartElement () {
    return this.startElement
  }

  toJSON () {
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
  toMD () {
    let result = []
    let elementNames = Object.keys(this._elementSchemas)
    elementNames.sort()
    elementNames.forEach((name) => {
      let elementSchema = this._elementSchemas[name]
      result.push(`# <${elementSchema.name}>`)
      result.push('')
      result.push(`type: ${elementSchema.type}`)
      result.push('attributes: ' + map(elementSchema.attributes, (_, name) => { return name }).join(', '))
      result.push('children:')
      result.push('  ' + elementSchema.expr.toString())
      result.push('')
    })
    return result.join('\n')
  }

  validateElement (el) {
    let tagName = el.tagName
    let elementSchema = this.getElementSchema(tagName)
    return _validateElement(elementSchema, el)
  }
}

XMLSchema.fromJSON = function (data) {
  let elementSchemas = {}
  forEach(data.elements, (elData) => {
    let elSchema = ElementSchema.fromJSON(elData)
    elementSchemas[elSchema.name] = elSchema
  })
  return new XMLSchema(elementSchemas, data.start)
}

class ElementSchema {
  constructor (name, type, attributes, expr) {
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

  toJSON () {
    return {
      name: this.name,
      type: this.type,
      attributes: this.attributes,
      elements: this.expr.toJSON()
    }
  }

  isAllowed (tagName) {
    return this.expr.isAllowed(tagName)
  }

  isTextAllowed () {
    return this.expr.isAllowed(TEXT)
  }

  printStructure () {
    return `${this.name} ::= ${this.expr.toString()}`
  }

  findFirstValidPos (el, newTag) {
    return this.expr._findInsertPos(el, newTag, 'first')
  }

  findLastValidPos (el, newTag) {
    return this.expr._findInsertPos(el, newTag, 'last')
  }
}

ElementSchema.fromJSON = function (data) {
  return new ElementSchema(
    data.name,
    data.type,
    data.attributes,
    Expression.fromJSON(data.elements)
  )
}

function _validateElement (elementSchema, el) {
  let errors = []
  let valid = true
  { // Attributes
    const res = _checkAttributes(elementSchema, el)
    if (!res.ok) {
      errors = errors.concat(res.errors)
      valid = false
    }
  }
  // Elements
  if (elementSchema.type === 'external' || elementSchema.type === 'not-implemented') {
    // skip
  } else {
    let res = _checkChildren(elementSchema, el)
    if (!res.ok) {
      errors = errors.concat(res.errors)
      valid = false
    }
  }
  return {
    errors,
    ok: valid
  }
}

function _checkAttributes(elementSchema, el) { // eslint-disable-line
  return { ok: true }
}

function _checkChildren (elementSchema, el) {
  // Don't validate external nodes
  // TODO: maybe we should do this too?
  if (elementSchema.type === 'external' || elementSchema.type === 'not-implemented') {
    return true
  }
  const isText = elementSchema.type === 'text'
  const expr = elementSchema.expr
  const state = expr.getInitialState()
  const iterator = el.getChildNodeIterator()
  let valid = true
  while (valid && iterator.hasNext()) {
    const childEl = iterator.next()
    let token
    if (childEl.isTextNode()) {
      // Note: skipping empty text being child node of elements
      if (_isTextNodeEmpty(childEl)) {
        continue
      } else {
        token = TEXT
      }
    } else if (childEl.isElementNode()) {
      token = childEl.tagName
    } else if (childEl.getNodeType() === 'cdata') {
      // CDATA elements are treated as a TEXT fragment
      token = TEXT
    } else {
      continue
    }
    if (!expr.consume(state, token)) {
      valid = false
    }
  }
  // add the element to the errors
  if (state.errors.length > 0) {
    state.errors.forEach((err) => {
      err.el = el
    })
  }
  const isFinished = expr.isFinished(state)
  // HACK: adding an exception here for text elements, as they are allowed to be empty
  // TODO: from an architectural point of view, this should be solved in the DFA in the first place
  if (valid && !isFinished && !isText) {
    state.errors.push({
      msg: `<${el.tagName}> is incomplete.\nSchema: ${expr.toString()}`,
      el
    })
    valid = false
  }
  if (valid) {
    state.ok = true
  }
  return state
}
