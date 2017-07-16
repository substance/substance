import { isString } from '../util'
import { DefaultDOMElement } from '../dom'
import XMLSchema from './XMLSchema'
import analyzeSchema from './_analyzeSchema'
import DFA from './DFA'
import _loadRNG from './_loadRNG'
import _registerDefinitions from './_registerDefinitions'
import { createExpression, Token, Choice, Sequence, Optional, Plus, Kleene, Interleave } from './RegularLanguage'

const TEXT = DFA.TEXT

export default
function compileRNG(fs, searchDirs, entry) {
  let rng
  // used for testing
  if (arguments.length === 1 && isString(arguments[0])) {
    rng = DefaultDOMElement.parseXML(arguments[0])
  } else {
    rng = _loadRNG(fs, searchDirs, entry)
  }

  const grammar = rng.find('grammar')
  if (!grammar) throw new Error('<grammar> not found.')
  // collect all definitions, supporting to override
  // for customizations
  _registerDefinitions(grammar)

  // for debugging/analysis create an expanded representation
  // let expanded = _expand(grammar)
  // console.info("Expanded grammar:", expanded.getNativeElement())

  // turn the RNG schema into our internal data structure
  _compile(grammar)

  let xmlSchema = new XMLSchema(grammar.schemas)
  // this adds some reflection info and derives the type
  analyzeSchema(xmlSchema)
  // // type overrides
  const elementTypes = rng.findAll('elementType')
  elementTypes.forEach((el) => {
    const elementSchema = xmlSchema.getElementSchema(el.attr('name'))
    let type = el.attr('s:type') || el.attr('type')
    if (!type) throw new Error('Invalid elementType definition')
    elementSchema.type = type
  })

  return xmlSchema
}

/*
  TODO: compile attributes separatedly.
*/
function _compile(grammar) {
  const elements = grammar.findAll('element')
  grammar._visiting = {}
  const schemas = {}
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]
    const name = el.attr('name')
    const type = el.attr('type') || el.attr('s:type') || 'implicit'
    // console.log('processing <%s>', name)
    let block = _processChildren(el, grammar)
    let expr = createExpression(name, block)
    // simplify the expression structure
    // which is helpful when using pre-defined
    // groups or choices
    expr._normalize()

    let schema = {
      name,
      attributes: _collectAttributes(el, grammar),
      expr
    }
    // manually set type
    if (type) {
      schema.type = type
    }
    schemas[name] = schema
  }
  grammar.schemas = schemas

  // start element
  grammar.start = _extractStart(grammar)
}

function _extractStart(grammar) {
  // for now this is hard wired to work with the start
  // element as defined in JATS 1.1
  const start = grammar.find('start')
  if (!start) {
    throw new Error('<grammar> must have a <start> element')
  }
  // HACK: we assume that there is exactly one ref to
  // an element definition
  const startRef = start.find('ref')
  if (!startRef) {
    throw new Error('Expecting one <ref> inside of <start>.')
  }
  const name = startRef.attr('name')
  let startElement = grammar.schemas[name]
  if (!startElement) {
    throw new Error(`Could not find element schema for start element ${name}.`)
  }
  return startElement
}

function _processChildren(el, grammar) {
  let blocks = _processBlocks(el.children, grammar)
  if (blocks.length === 1) {
    return blocks[0]
  } else {
    return new Sequence(blocks)
  }
}

function _processBlocks(children, grammar) {
  const blocks = []
  for (var i = 0; i < children.length; i++) {
    const child = children[i]
    // const name = child.attr('name')
    switch(child.tagName) {
      // skip these
      case 'attribute':
      case 'empty':
      case 'notAllowed': {
        break
      }
      case 'element': {
        const elName = child.attr('name')
        blocks.push(new Token(elName))
        break
      }
      case 'text': {
        blocks.push(new Token(TEXT))
        break
      }
      case 'ref': {
        const block = _processReference(child, grammar)
        blocks.push(block)
        break
      }
      case 'group': {
        blocks.push(_processSequence(child, grammar))
        break
      }
      case 'choice': {
        const block = _processChoice(child, grammar)
        blocks.push(block)
        break
      }
      case 'optional': {
        const block = new Optional(_processChildren(child, grammar))
        blocks.push(block)
        break
      }
      case 'oneOrMore': {
        const block = new Plus(_processChildren(child, grammar))
        blocks.push(block)
        break
      }
      case 'zeroOrMore': {
        const block = new Kleene(_processChildren(child, grammar))
        blocks.push(block)
        break
      }
      case 'interleave': {
        const block = new Interleave(_processBlocks(child.children, grammar))
        blocks.push(block)
        break
      }
      default:
        throw new Error('Not supported yet: ' + child.tagName)
    }
  }
  return blocks
}

function _processSequence(el, grammar) {
  if (el.expr) return el.expr.copy()
  const blocks = _processBlocks(el.children, grammar)
  el.expr = new Sequence(blocks)
  return el.expr
}

function _processChoice(el, grammar) {
  if (el.expr) return el.expr.copy()
  let blocks = _processBlocks(el.children, grammar)
  el.expr = new Choice(blocks)
  return el.expr
}

function _processReference(ref, grammar) {
  const name = ref.attr('name')
  const def = grammar.defs[name]
  if (!def) throw new Error(`Illegal ref: ${name} is not defined.`)
  if (def.expr) return def.expr.copy()
  // Guard for cyclic references
  // TODO: what to do with cyclic refs?
  if (grammar._visiting[name]) {
    throw new Error('Cyclic references are not supported yet')
  }
  grammar._visiting[name] = true
  const block = _processChildren(def, grammar)
  def.expr = block
  delete grammar._visiting[name]
  return def.expr
}

function _collectAttributes(el, grammar, attributes = {}) {
  // ATTENTION: RNG supports more than we do here
  // We just collect all attributes, infering no rules
  let children = el.children
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    switch (child.tagName) {
      case 'attribute': {
        const attr = _transformAttribute(child)
        attributes[attr.name] = attr
        break
      }
      case 'ref': {
        const name = child.attr('name')
        const def = grammar.defs[name]
        if (!def) throw new Error('Illegal ref')
        // Guard for cyclic references
        // TODO: what to do with cyclic refs?
        if (grammar._visiting[name]) {
          throw new Error('Cyclic references are not supported yet')
        }
        grammar._visiting[name] = true
        _collectAttributes(def, grammar, attributes)
        delete grammar._visiting[name]
        break
      }
      case 'group':
      case 'choice':
      case 'optional':
      case 'oneOrMore':
      case 'zeroOrMore': {
        _collectAttributes(child, grammar, attributes)
        break
      }
      default:
        //
    }
  }
  return attributes
}

function _transformAttribute(el) {
  const name = el.attr('name')
  // TODO: extract all the attribute specs
  return {
    name
  }
}
