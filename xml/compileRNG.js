import { DefaultDOMElement } from '../dom'
import { isArray, forEach } from '../util'
import DFA from './DFA'
import DFABuilder from './DFABuilder'
import XMLSchema from './XMLSchema'
import analyzeSchema from './analyzeSchema'

const TEXT = DFA.TEXT
const singleToken = DFABuilder.singleToken

export default
function compileRNG(fs, searchDirs, entry, manualClassification) {
  if (!isArray(searchDirs)) searchDirs = [searchDirs]
  let rngPath = _lookupRNG(fs, searchDirs, entry)
  let rngStr = fs.readFileSync(rngPath, 'utf8')
  const rng = DefaultDOMElement.parseXML(rngStr, 'full-doc')

  // first pull in all includes (recursively)
  while(_expandIncludes(fs, searchDirs, rng)) {
    //
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

  const elementSchemas = grammar.schemas
  let xmlSchema = new XMLSchema(grammar.schemas)
  analyzeSchema(xmlSchema)

  if (manualClassification) {
    forEach(manualClassification, (type, name) => {
      const elementSchema = xmlSchema.getElementSchema(name)
      elementSchema.type = type
    })
  }

  return xmlSchema
}

function _lookupRNG(fs, searchDirs, file) {
  for (let i = 0; i < searchDirs.length; i++) {
    let absPath = searchDirs[i] + '/' + file
    if (fs.existsSync(absPath)) {
      return absPath
    }
  }
}

function _expandIncludes(fs, searchDirs, root) {
  let includes = root.findAll('include')
  if (includes.length === 0) return false

  includes.forEach((include) => {
    const parent = include.parentNode
    const href = include.attr('href')
    const rngPath = _lookupRNG(fs, searchDirs, href)
    if (!rngPath) throw new Error(`Could not find ${href}`)
    const rngStr = fs.readFileSync(rngPath, 'utf8')
    const rng = DefaultDOMElement.parseXML(rngStr, 'full-doc')
    const grammar = rng.find('grammar')
    if (!grammar) throw new Error('No grammar element found')
    grammar.children.forEach((child) => {
      parent.insertBefore(child, include)
    })
    include.remove()
  })
  return true
}

function _registerDefinitions(grammar) {
  let defs = {}
  let start = null
  grammar.children.forEach((child) => {
    const tagName = child.tagName
    switch (tagName) {
      /*
        TODO: in theory there are pretty complex merges
        possible using 'combine'
        In JATS, defines are used either to join attributes
        or to override a definition
      */
      case 'define': {
        const name = child.attr('name')
        const combine = child.attr('combine')
        if (defs[name]) {
          if (combine === 'interleave') {
            defs[name].append(child.children)
            break
          } else {
            console.error('Overriding definition', name)
          }
        }
        defs[name] = child
        break
      }
      case 'start': {
        start = child
        break
      }
      default:
        throw new Error('Illegal state.')
    }
  })
  grammar.defs = defs
  grammar.start = start
}

/*
 TODO:
  compile attributes separatedly. RNG has a so much different
  semantics for attributes.
*/
function _compile(grammar) {
  const elements = grammar.findAll('element')
  grammar._visiting = {}
  const schemas = {}
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]
    const name = el.attr('name')
    // console.log('processing <%s>', name)
    let dfa = _processSequence(el, grammar)
    let schema = {
      name,
      attributes: _collectAttributes(el, grammar),
      dfa
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
  let name = grammar.start.find('ref').attr('name')
  return grammar.schemas[name]
}

function _processSequence(el, grammar) {
  if (el.dfa) return el.dfa.copy()
  const dfa = new DFABuilder()
  const children = el.children
  for (var i = 0; i < children.length; i++) {
    const child = children[i]
    // const name = child.attr('name')
    switch(child.tagName) {
      case 'attribute': {
        // TODO: we should compile the attribute into
        // an internal format
        // const attr = _transformAttribute(child)
        // dfa.addAttribute(attr.name, attr)
        break
      }
      case 'element': {
        const elName = child.attr('name')
        dfa.append(singleToken(elName))
        break
      }
      case 'empty':
        break
      // TODO: need to rethink this
      // RNG is a bit difficult to interpret as the meaning
      // of elements is very contextual (e.g. from where a ref is used)
      case 'notAllowed':
        break
      case 'text': {
        dfa.append(singleToken(TEXT))
        break
      }
      case 'ref': {
        const childDFA = _processReference(child, grammar)
        dfa.append(childDFA)
        break
      }
      case 'choice': {
        const childDFA = _transformChoice(child, grammar)
        dfa.append(childDFA)
        break
      }
      case 'optional': {
        let childDFA = _processSequence(child, grammar)
        childDFA = childDFA.optional()
        dfa.append(childDFA)
        break
      }
      case 'oneOrMore': {
        let childDFA = _processSequence(child, grammar)
        childDFA = childDFA.plus()
        dfa.append(childDFA)
        break
      }
      case 'zeroOrMore': {
        let childDFA = _processSequence(child, grammar)
        childDFA = childDFA.kleene()
        dfa.append(childDFA)
        break
      }
      default:
        throw new Error('Not supported yet')
    }
  }
  el.dfa = dfa
  return dfa
}

function _processReference(ref, grammar) {
  const name = ref.attr('name')
  const def = grammar.defs[name]
  if (!def) throw new Error(`Illegal ref: ${name} is not defined.`)
  if (def.dfa) return def.dfa.copy()
  // Guard for cyclic references
  // TODO: what to do with cyclic refs?
  if (grammar._visiting[name]) {
    throw new Error('Cyclic references are not supported yet')
  }
  grammar._visiting[name] = true
  const dfa = _processSequence(def, grammar)
  def.dfa = dfa
  delete grammar._visiting[name]
  return dfa
}

function _transformChoice(choice, grammar) {
  let children = choice.children
  let dfa = new DFABuilder()
  let L = children.length
  for (let i = 0; i < L; i++) {
    let child = children[i]
    switch(child.tagName) {
      case 'ref': {
        dfa.merge(_processReference(child, grammar))
        break
      }
      case 'empty':
        break
      case 'text': {
        dfa.merge(singleToken(TEXT))
        break
      }
      case 'group': {
        dfa.merge(_processSequence(child, grammar))
        break
      }
      case 'choice': {
        dfa.merge(_transformChoice(child, grammar))
        break
      }
      case 'optional': {
        dfa.merge(_processSequence(child, grammar).optional())
        break
      }
      case 'oneOrMore': {
        dfa.merge(_processSequence(child, grammar).plus())
        break
      }
      case 'zeroOrMore': {
        dfa.merge(_processSequence(child, grammar).kleene())
        break
      }
      default:
        throw new Error('Not supported yet')
    }
  }
  return dfa
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

function _expand(grammar) { // eslint-disable-line no-unused-vars
  const elements = grammar.findAll('element')
  let expanded = grammar.createElement('grammar')
  grammar._visiting = {}
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]
    const expandedEl = _expandElement(el, grammar)
    // flatten nested choices
    let nestedChoice
    while( (nestedChoice = expandedEl.find('choice > choice')) ) {
      let parentNode = nestedChoice.parentNode
      let children = nestedChoice.children
      for (let j = 0; j < children.length; j++) {
        const child = children[j]
        parentNode.insertBefore(child, nestedChoice)
      }
      nestedChoice.remove()
    }
    expanded.append(expandedEl)
  }
  return expanded
}

function _expandElement(el, grammar) {
  el = el.clone()
  const children = el.children
  for (var i = 0; i < children.length; i++) {
    const child = children[i]
    const parentNode = child.parentNode
    // const name = child.attr('name')
    switch(child.tagName) {
      case 'element': {
        parentNode.replaceChild(child, el.createElement('element').attr('name', child.attr('name')))
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
        let expandedDef = _expandElement(def, grammar)
        expandedDef.children.forEach((_child) => {
          parentNode.insertBefore(_child, child)
        })
        child.remove()
        delete grammar._visiting[name]
        break
      }
      default: {
        parentNode.replaceChild(child, _expandElement(child, grammar))
      }
    }
  }
  return el
}