export default function _expandDefinitions(grammar) { // eslint-disable-line no-unused-vars
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