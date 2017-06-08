import { forEach } from '../util'
import DFA from './DFA'

const { START, END, TEXT, EPSILON } = DFA

/*
  Element types:

  - text: all 'paths' must allow text
  - element: no 'paths' allow text
  - hybrid: mixed
  - annotation: text element used only in text elements
  - inline: element used only in text elements
  - anchor: inline element/annotation without content

*/
export default
function analyze(xmlSchema) {
  const tagNames = xmlSchema.getTagNames()
  // preparations
  const elementSchemas = tagNames.map((name) => {
    const elementSchema = xmlSchema.getElementSchema(name)
    Object.assign(elementSchema, {
      type: 'element',
      children: {},
      parents: {},
    })
    return elementSchema
  })
  // extract records
  elementSchemas.forEach((elementSchema) => {
    _analyzeElementSchema(elementSchema, xmlSchema)
  })
  // post-processing
  let records = {}
  elementSchemas.forEach((elementSchema) => {
    let r = ['name', 'type', 'children', 'parents', 'siblings',
      'isStructured', 'isText',
      'usedInlineBy', 'usedStructuredBy'
    ].reduce((m, n) => {
      if (elementSchema[n]) {
        m[n] = elementSchema[n]
      }
      return m
    }, {})
    records[r.name] = r
  })
  tagNames.forEach((name) => {
    const r = records[name]
    // link the records in parent/children maps
    r.children = Object.keys(r.children).reduce((m, n) => {
      m[n] = records[n]
      return m
    }, {})
    r.parents = Object.keys(r.parents).reduce((m, n) => {
      m[n] = records[n]
      return m
    }, {})
  })
  return records
}

function _analyzeElementSchema(elementSchema, xmlSchema) {
  const dfa = elementSchema.dfa
  if (!dfa.transitions) return
  const name = elementSchema.name
  // group start edges by follow state
  let first = {}
  forEach(dfa.transitions[START], (to, token) => {
    if (!first[to]) first[to] = []
    first[to].push(token)
  })
  let visited = {START: true, END: true}
  let hasText = false
  let hasElements = false
  forEach(first, (tokens, state) => {
    let _children = tokens.reduce((m, token) => {
      if (token !== EPSILON) {
        m[token] = true
      }
      return m
    }, {})
    let stack = [state]
    while(stack.length > 0) {
      let from = stack.pop()
      if (state === END) continue
      visited[from] = true
      let T = dfa.transitions[from]
      if (!T) throw new Error(`Internal Error: no transition from state ${from}`)
      let tokens = Object.keys(T)
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i]
        const to = T[token]
        if (!visited[to]) stack.push(to)
        const childSchema = xmlSchema.getElementSchema(token)
        if (!childSchema) continue
        childSchema.parents[name] = true
        elementSchema.children[token] = true
        _children[token] = true
      }
    }
    {
      // if there is TEXT allowed on this path
      // mark all recorded tags as inline
      const tokens = Object.keys(_children)
      if (_children[TEXT]) {
        hasText = true
        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i]
          const childSchema = xmlSchema.getElementSchema(token)
          if (!childSchema) continue
          if (!childSchema.usedInlineBy) childSchema.usedInlineBy = {}
          childSchema.usedInlineBy[name] = true
        }
      } else if (Object.keys(_children).length > 0) {
        hasElements = true
        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i]
          const childSchema = xmlSchema.getElementSchema(token)
          if (!childSchema) continue
          if (!childSchema.usedStructuredBy) childSchema.usedStructuredBy = {}
          childSchema.usedStructuredBy[name] = true
        }
      }
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i]
        const childSchema = xmlSchema.getElementSchema(token)
        if (!childSchema) continue
        if (!childSchema.siblings) childSchema.siblings = {}
        childSchema.siblings[name] = tokens
      }
    }
  })
  if (hasElements) {
    elementSchema.isStructured = true
  }
  if (hasText) {
    elementSchema.isText = true
  }
  // automatic classification
  if (hasElements && hasText) {
    elementSchema.type = 'hybrid'
  } else if (hasText) {
    elementSchema.type = 'text'
  }
}
