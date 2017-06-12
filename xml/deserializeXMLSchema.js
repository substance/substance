import { forEach } from '../util'
import DFA from './DFA'
import XMLSchema from './XMLSchema'

const { START, END, TEXT, EPSILON } = DFA

const TYPES = ['element', 'text', 'inline-element', 'annotation', 'anchor', 'hybrid', 'external', 'container']

export default
function deserialize(data) {
  data = data.slice()

  let elementSchemas = {}
  let tagNames = data.shift()
  let attributeNames = data.shift()
  let tokenMapping = tagNames.reduce((m,k,idx)=>{m[idx]=k;return m}, {})
  tokenMapping['E'] = EPSILON
  tokenMapping['T'] = TEXT
  let attributeMapping = attributeNames.reduce((m,k,idx)=>{m[idx]=k;return m}, {})
  if (tagNames.length !== data.length) throw new Error('Invalid format: number of tagNames should match number of specs')
  for (let i = 0; i < tagNames.length; i++) {
    const name = tagNames[i]
    const record = data[i]
    const type = TYPES[record[0]]
    const attrData = record[1]
    const dfaData = record[2]
    const attributes = _deserializeAttributes(attrData, attributeMapping)
    const dfa = _deserializeDFA(dfaData, tokenMapping)
    elementSchemas[name] = { name, type, attributes, dfa }
  }

  return new XMLSchema(elementSchemas)
}

function _deserializeAttributes(attrData, attributeMapping) {
  // TODO: we should support constraints on values and enumerations
  return attrData.reduce((m,k)=>{m[attributeMapping[k]]=true;return m}, {})
}

function _deserializeDFA(dfaData, tokenMapping) {
  let dfa = {}
  forEach(dfaData, (_T, from) => {
    if (from === 'S') from = START
    let T = dfa[from]
    if (!T) dfa[from] = T = {}
    forEach(_T, (tokens, to) => {
      if (to === 'S') to = START
      else if (to === 'E') to = END
      tokens.forEach((t) => {
        T[tokenMapping[t]] = to
      })
    })
  })
  return new DFA(dfa)
}
