import _requiresPropertyElements from './_requiresPropertyElements'

export default function createValidator (rootType, definition) {
  const nodeChecks = new Map()
  for (const nodeSpec of definition.nodes.values()) {
    const type = nodeSpec.type
    nodeChecks.set(type, _createChecks(nodeSpec))
  }
  return new Validator(rootType, nodeChecks)
}

class Validator {
  constructor (rootType, nodeChecks) {
    this.rootType = rootType
    this.nodeChecks = nodeChecks
  }

  validate (xmlDom) {
    const state = new ValidatorState()
    const rootEls = xmlDom.children.filter(c => c.tagName === this.rootType)
    if (rootEls === 0) {
      state.error({ message: `Root element ${this.rootType} not found` })
    } else if (rootEls.length > 1) {
      state.error({ message: `Only one root element ${this.rootType} is allowed` })
    }
    xmlDom.findAll(['id']).reduce((s, el) => {
      const id = el.id
      if (s.has(id)) {
        state.error({ message: `Another element with the same id exists: ${id}` })
      } else {
        s.add(id)
      }
      return s
    }, new Set())

    state.requestChecks(rootEls)
    while (!state.hasFinished()) {
      const el = state.next()
      if (!this.nodeChecks.has(el.tagName)) {
        state.error({ message: `Unknown element type ${el.tagName}` })
      } else {
        const { checks, nodeSpec } = this.nodeChecks.get(el.tagName)
        for (const check of checks) {
          check(state, el, { nodeSpec })
        }
        // check for unused property elements, which is only necessary where property elements are used
        if (_requiresPropertyElements(nodeSpec)) {
          for (const c of state._currentPropertyElements) {
            state.error({ message: `element ${c.tagName} is not allowed in ${el.tagName}.` })
          }
        }
        for (const attr of state._currentAttributes) {
          state.error({ message: `attribute ${attr} is not allowed in ${el.tagName}.` })
        }
      }
    }
    return state
  }
}

class ValidatorState {
  constructor () {
    this.queue = []
    this.errors = []
  }

  get ok () {
    return this.errors.length === 0
  }

  error (err) {
    this.errors.push(err)
  }

  requestChecks (els) {
    this.queue = this.queue.concat(els)
  }

  hasFinished () {
    return this.queue.length === 0
  }

  next () {
    const el = this.queue.shift()
    this._currentAttributes = new Set(Array.from(el.getAttributes().keys()))
    this._currentPropertyElements = new Set(el.children)
    return el
  }

  elementChecked (el) {
    this._currentPropertyElements.delete(el)
  }

  attributeChecked (attr) {
    this._currentAttributes.delete(attr)
  }
}

function _createChecks (nodeSpec) {
  // validation checks
  const checks = []
  const nodeType = nodeSpec.type

  // add checkers for built-in properties (only id at the moment)
  checks.push(_attributeChecker(nodeType, 'id', str => {
    if (!/^[_@a-zA-Z][_@a-zA-Z0-9-]+$/.exec(str)) {
      return `Invalid id: ${str}`
    }
  }))

  for (const [propName, propSpec] of nodeSpec.properties.entries()) {
    checks.push(_createPropertyChecker(nodeSpec, propName, propSpec))
  }

  return {
    checks,
    nodeSpec
  }
}

function _createPropertyChecker (nodeSpec, propName, propSpec) {
  const nodeType = nodeSpec.type
  function _checkChildType (child, errors) {
    if (!targetTypes.has(child.tagName)) {
      errors.push(`Element of type ${child.tagName} not allowed in ${nodeType} > ${propName}. Expected one of ${Array.from(targetTypes).join(',')}`)
    }
  }
  function _checkTargetType (el, id, errors) {
    const target = el.getOwnerDocument().getElementById(id)
    if (!target) {
      errors.push(`Target element ${id} does not exist for ${nodeType}@${propName}`)
    } else if (!targetTypes.has(target.tagName)) {
      errors.push(`Target type ${target.tagName} is not allowed for ${nodeType}@${propName}`)
    }
  }

  const type = propSpec.type
  const options = propSpec.options || {}
  const targetTypes = new Set(options.childTypes || options.targetTypes || [])

  switch (type) {
    case 'integer': {
      return _attributeChecker(nodeType, propName, str => {
        if (isNaN(str) || str !== parseInt(str)) {
          return `Expected integer. Actual value: ${str}`
        }
      })
    }
    case 'number': {
      return _attributeChecker(nodeType, propName, str => {
        if (isNaN(str)) {
          return `Expected number. Actual value: ${str}`
        }
      })
    }
    case 'boolean': {
      return _attributeChecker(nodeType, propName, str => {
        if (str !== 'true' && str !== 'false') {
          return `Expected boolean (true|false). Actual value: ${str}`
        }
      })
    }
    case 'string': {
      return _attributeChecker(nodeType, propName, str => {
        // nothing special here
      })
    }
    case 'enum': {
      return _attributeChecker(nodeType, propName, str => {
        if (!options.values.has(str)) {
          return `Unsupported enum value. Expected one of ${Array.from(options.values).join(',')}, but was ${str}`
        }
      })
    }
    case 'one': {
      return _attributeChecker(nodeType, propName, (str, el) => {
        const errors = []
        this._checkTargetType(el, str, errors)
        return errors
      })
    }
    case 'many': {
      return _attributeChecker(nodeType, propName, (str, el) => {
        const errors = []
        const ids = str.split(',').map(id => id.trim())
        for (const id of ids) {
          _checkTargetType(el, id, errors)
        }
        return errors
      })
    }
    case 'child': {
      return _elementChecker(nodeSpec, propName, (state, el) => {
        const errors = []
        _checkChildType(el, errors)
        state.requestChecks(el)
        return errors
      })
    }
    case 'children':
    case 'container':
    case 'text': {
      return _elementChecker(nodeSpec, propName, (state, el) => {
        const children = el.getChildren()
        const errors = []
        for (const child of children) {
          _checkChildType(child, errors)
        }
        return errors
      })
    }
    default:
      throw new Error('Invalid type: ' + type)
  }
}

function _attributeChecker (type, propertyName, check) {
  return (state, el) => {
    const str = el.getAttribute(propertyName)
    if (str) {
      // checker returns error message
      const error = check(str, el)
      if (error) {
        state.error({ type, propertyName, error })
      }
    }
    state.attributeChecked(propertyName)
  }
}

function _elementChecker (nodeSpec, propertyName, check) {
  return (state, el, { nodeSpec }) => {
    const nodeType = nodeSpec.type
    const propSpec = nodeSpec.properties.get(propertyName)
    // For now, we force property elements for all 'structured' nodes
    if (_requiresPropertyElements(nodeSpec)) {
      const propertyEl = el.children.find(c => c.tagName === propertyName)
      if (!propertyEl) {
        if (!propSpec.options.optional) {
          state.error({ type: nodeType, propertyName, message: `Child element ${propertyName} is missing` })
        }
      } else {
        const errors = check(state, propertyEl, { nodeSpec })
        if (errors && errors.length > 0) {
          errors.forEach(error => state.error({ type: nodeType, propertyName, error }))
        }
        state.requestChecks(propertyEl.children)
        state.elementChecked(propertyEl)
      }
    // no property elements: this is the case for text nodes
    // TODO: in the future we might want to add a flag to the node spec to allow
    // this for 'structured' nodes, too (e.g. a list could spare an extra 'items' element)
    } else {
      const errors = check(state, el, { nodeSpec })
      if (errors && errors.length > 0) {
        errors.forEach(error => state.error({ type: nodeType, propertyName, error }))
      }
      state.requestChecks(el.children)
    }
  }
}
