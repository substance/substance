import { DefaultDOMElement } from '../dom'
import _lookupRNG from './_lookupRNG'

export default function _expandIncludes(fs, searchDirs, root) {
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
