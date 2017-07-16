import DFA from './DFA'
// TODO: we should hide this behind the Expression API
import { DFAExpr, InterleaveExpr } from './RegularLanguage'

const { TEXT } = DFA

export default
function analyze(xmlSchema) {
  const tagNames = xmlSchema.getTagNames()
  const elementSchemas = tagNames.map((name) => {
    const elementSchema = xmlSchema.getElementSchema(name)
    Object.assign(elementSchema, {
      children: {},
      parents: {},
      siblings: {},
      usedInlineBy: {},
      usedStructuredBy: {}
    })
    return elementSchema
  })
  elementSchemas.forEach((elementSchema) => {
    _analyzeElementSchema(elementSchema, xmlSchema)
  })

  // TODO: it looks like this has not been used anymore

  // let records = {}
  // elementSchemas.forEach((elementSchema) => {
  //   let r = ['name', 'type', 'children', 'parents', 'siblings',
  //     'isStructured', 'isText',
  //     'usedInlineBy', 'usedStructuredBy'
  //   ].reduce((m, n) => {
  //     if (elementSchema[n]) {
  //       m[n] = elementSchema[n]
  //     }
  //     return m
  //   }, {})
  //   records[r.name] = r
  // })
  // tagNames.forEach((name) => {
  //   const r = records[name]
  //   // link the records in parent/children maps
  //   r.children = Object.keys(r.children).reduce((m, n) => {
  //     m[n] = records[n]
  //     return m
  //   }, {})
  //   r.parents = Object.keys(r.parents).reduce((m, n) => {
  //     m[n] = records[n]
  //     return m
  //   }, {})
  // })
  // return records
}

/*
 We use this to detect automatically, if an
 element is used as a text node or an element node,
 or both at the same time.
*/
function _analyzeElementSchema(elementSchema, xmlSchema) {
  const expr = elementSchema.expr
  const name = elementSchema.name
  if (!expr) return
  let _siblings = []
  if (expr instanceof DFAExpr) {
    if (expr.dfa) {
      _siblings = expr.dfa._tokensByPath()
    }
  } else if (expr instanceof InterleaveExpr) {
    expr.dfas.forEach((dfa) => {
      if (dfa) {
        _siblings = _siblings.concat(dfa._tokensByPath())
      }
    })
  }
  if (_siblings.length === 0) {
    // use 'element' for nodes with type 'implicit'
    // TODO: do we really need 'implicit'?
    if (elementSchema.type === 'implicit') elementSchema.type = 'element'
  }

  let hasText = false
  let hasElements = false
  _siblings.forEach((tagNames) => {
    // register each other as parent and children
    let _hasText = tagNames.indexOf(TEXT) >= 0
    let _hasElements = (!_hasText && tagNames.length > 0)
    if (_hasText) {
      hasText = true
    }
    if (_hasElements) {
      hasElements = true
    }
    tagNames.forEach((tagName) => {
      const childSchema = xmlSchema.getElementSchema(tagName)
      if (!childSchema) return
      childSchema.parents[name] = true
      elementSchema.children[tagName] = true
      // Note: we store siblings, grouped by parent
      elementSchema.siblings[name] = tagNames
      if (_hasElements) childSchema.usedStructuredBy[name] = true
      if (_hasText) childSchema.usedInlineBy[name] = true
    })
  })
  // TODO: do we really need this?
  if (hasElements) {
    elementSchema.isStructured = true
  }
  if (hasText) {
    elementSchema.isText = true
  }
  if (elementSchema.type === 'implicit') {
    if (hasText) {
      elementSchema.type = 'text'
    } else {
      elementSchema.type = 'element'
    }
  }
}
