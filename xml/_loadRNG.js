import DefaultDOMElement from '../dom/DefaultDOMElement'
import isArray from '../util/isArray'
import _expandIncludes from './_expandIncludes'
import _lookupRNG from './_lookupRNG'


/*
  Loads a RNG with all dependencies into a DOM element
*/
export default function _loadRNG(fs, searchDirs, entry) {
  if (!isArray(searchDirs)) searchDirs = [searchDirs]
  let rngPath = _lookupRNG(fs, searchDirs, entry)
  let rngStr = fs.readFileSync(rngPath, 'utf8')
  const rng = DefaultDOMElement.parseXML(rngStr, 'full-doc')
  // first pull in all includes (recursively)
  while(_expandIncludes(fs, searchDirs, rng)) { /* nothing */ }
  return rng
}
