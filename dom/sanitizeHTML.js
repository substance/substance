import parseMarkup from './parseMarkup'
import DomUtils from '../vendor/domutils'
import MemoryDOMElement from './MemoryDOMElement'

const ELEMENT_BLACK_LIST = new Set(['script', 'object', 'embed', 'link', 'math', 'iframe', 'comment', 'base'])
const ATTRIBUTE_BLACK_LIST = new Set(['form', 'formaction', 'autofocus', 'dirname'])

/*
  TODO: measures mentioned on html5sec.org
  - Make sure only relative URIs, http URIs and correctly MIME-typed data URIs can be used for VIDEO poster attributes
*/

export default function sanitizeHTML (html, options = {}) {
  let doc = parseMarkup(html, {
    format: 'html',
    xmlMode: true,
    elementFactory: (type, data) => {
      return new MemoryDOMElement(type, data)
    }
  })
  _noFormsWithId(doc)

  let sanitized = DomUtils.getOuterHTML(doc, {
    decodeEntities: true,
    disallowedTags: ELEMENT_BLACK_LIST,
    disallowHandlers: true,
    disallowedAttributes: ATTRIBUTE_BLACK_LIST,
    stripComments: true,
    stripCDATA: true
  })
  return sanitized
}

function _noFormsWithId (doc) {
  doc.findAll('form').forEach(f => {
    f.removeAttribute('id')
  })
}
