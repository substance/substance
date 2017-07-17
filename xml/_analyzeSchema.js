import { forEach } from '../util'
import DFA from './DFA'
// TODO: we should hide this behind the Expression API
import { DFAExpr, InterleaveExpr } from './RegularLanguage'

const { TEXT } = DFA

export default function analyze(elementSchemas) {
  forEach(elementSchemas, (elementSchema) => {
    Object.assign(elementSchema, {
      children: {},
      parents: {},
      siblings: {},
      usedInlineBy: {},
      usedStructuredBy: {}
    })
  })
  forEach(elementSchemas, (elementSchema) => {
    _analyzeElementSchema(elementSchema, elementSchemas)
  })
}

/*
 We use this to detect automatically, if an
 element is used as a text node or an element node,
 or both at the same time.
*/
function _analyzeElementSchema(elementSchema, elementSchemas) {
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
      const childSchema = elementSchemas[tagName]
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
