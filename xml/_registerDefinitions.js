import nameWithoutNS from './nameWithoutNS'

export default function _registerDefinitions(grammar) {
  let defs = {}
  let start = null
  grammar.children.forEach((child) => {
    const tagName = nameWithoutNS(child.tagName)
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
        // nothing
    }
  })
  grammar.defs = defs
  grammar.start = start
}
