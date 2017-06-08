import { forEach } from '../util'
import DFA from './DFA'

const { EPSILON, TEXT, START, END } = DFA

const TYPE_MAP = {
  'element': 0,
  'text': 1,
  'inline-element': 2,
  'annotation': 3,
  'anchor': 4,
  'hybrid': 5,
  'external': 6,
  'container': 7,
}

/*
  The schema is serialized to JSON, consisting of an Array of records
  ordered by tag name.

  To reduce size, DFAs are encoded
  ```
    { <from>: { <to>: tokens..., ... }, ... }
  ```
*/
export default
function serializeXMLSchema(xmlSchema) {
  let result = []

  // we store tag names for en/de-coding of transition tables
  let tagNames = xmlSchema.getTagNames()
  // TODO: we could sort elements by usage frequency, which should lead to smaller numbers in average
  tagNames.sort()
  result.push(tagNames)

  // we store all attribute names to encode attribute specifications
  let allAttributes = tagNames.reduce((allAttributes, t) => {
    const schema = xmlSchema.getElementSchema(t)
    forEach(schema.attributes, (attr, name) => {
      allAttributes[name] = true
    })
    return allAttributes
  }, {})
  let attributeNames = Object.keys(allAttributes)
  attributeNames.sort()
  result.push(attributeNames)

  // generate a mapping for enoding tokens
  let tokenMapping = tagNames.reduce((m,k,idx)=>{m[k]=idx;return m}, {})
  tokenMapping[EPSILON] = 'E'
  tokenMapping[TEXT] = 'T'

  // generate a mapping for encoding attributes
  let attributeMapping = attributeNames.reduce((m,k,idx)=>{m[k]=idx;return m}, {})

  for (let i = 0; i < tagNames.length; i++) {
    let name = tagNames[i]
    let schema = xmlSchema.getElementSchema(name)
    let type = TYPE_MAP[schema.type]
    let attrData = _serializeAttributes(schema.attributes, attributeMapping)
    let dfaData = _serializeDFA(schema.dfa, tokenMapping)
    result.push([type, attrData, dfaData])
  }

  return result
}

function _serializeAttributes(attributes, attributeMapping) {
  // TODO: we should support constraints on values and enumerations
  // TODO: we could also encode attribute names to reduce size (many of them are shared)
  return Object.keys(attributes).map(a=>attributeMapping[a])
}

/*
  TODO: we could pack this more, by introducing groups, which would need some sort of clustering
*/
function _serializeDFA(dfa, tokenMapping) {
  let result = {}
  // we encode states, too
  let stateMapping = {}
  stateMapping[START] = 'S'
  stateMapping[END] = 'E'

  // Attention: start with 1 so that value doesn't falsify
  let count = 1
  forEach(dfa.transitions, (T, from) => {
    if (!stateMapping[from]) stateMapping[from] = count++
    from = stateMapping[from]
    let _T = result[from]
    if (!_T) result[from] = _T = {}
    forEach(T, (to, token) => {
      if (!stateMapping[to]) stateMapping[to] = count++
      to = stateMapping[to]
      if (!_T[to]) _T[to] = []
      _T[to].push(tokenMapping[token])
    })
  })
  return result
}

