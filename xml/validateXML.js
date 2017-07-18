import DFA from './DFA'

const { TEXT } = DFA

export default function validateXML(xmlSchema, dom) {
  let root = dom.find(xmlSchema.getStartElement())
  if (!root) {
    return {
      errors: [{
        msg: 'Start element is missing.',
        el: dom
      }]
    }
  } else {
    return validateElement(xmlSchema, root)
  }
}

function validateElement(xmlSchema, el) {
  let errors = []
  let valid = true
  let q = [el]
  while(q.length>0) {
    let next = q.shift()
    const tagName = next.tagName
    const elementSchema = xmlSchema.getElementSchema(tagName)
    if (!elementSchema) throw new Error(`Unsupported element: ${tagName}`)
    let res = _validateElement(elementSchema, next)
    if (!res.ok) {
      errors = errors.concat(res.errors)
      valid = false
    }
    if (next.isElementNode()) {
      q = q.concat(next.getChildren())
    }
  }
  return {
    errors: errors,
    ok: valid
  }
}

function _validateElement(elementSchema, el) {
  let errors = []
  let valid = true
  { // Attributes
    const res = _checkAttributes(elementSchema, el)
    if (!res.ok) {
      errors = errors.concat(res.errors)
      valid = false
    }
  }
  { // Elements
    const res = _checkChildren(elementSchema, el)
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

function _checkChildren(elementSchema, el) {
  // Don't validate external nodes
  // TODO: maybe we should do this too?
  if (elementSchema.type === 'external') {
    return true
  }
  const expr = elementSchema.expr
  const state = expr.getInitialState()
  const iterator = el.getChildNodeIterator()
  let valid = true
  while (valid && iterator.hasNext()) {
    const childEl = iterator.next()
    let token
    if (childEl.isTextNode()) {
      // Note: skipping empty TextNodes
      if (/^\s*$/.exec(childEl.textContent)) {
        continue
      }
      token = TEXT
    } else if (childEl.isElementNode()) {
      token = childEl.tagName
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
  if (valid && !expr.isFinished(state)) {
    state.errors.push({
      msg: `<${el.tagName}> is incomplete.`,
      el
    })
    valid = false
  }
  if (valid) {
    state.ok = true
  }
  return state
}