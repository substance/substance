import { Parser } from './vendor'
import XDomHandler from './XDomHandler'
import XNode from './XNode'

/*
  Parses HTML or XML

  Options:
  - format: 'html' or 'xml'
  - ownerDocument: an XNode instance of type 'document'
*/
export default function parseMarkup(markup, options) {
  let parserOptions = Object.assign({}, options)
  let elementFactory
  if (options.ownerDocument) {
    elementFactory = options.ownerDocument
    parserOptions.xmlMode = (options.ownerDocument.format === 'xml')
  } else if (options.format) {
    elementFactory = new XNode('document', { format: options.format })
    parserOptions.xmlMode = (options.format === 'xml')
    delete parserOptions.format
  } else {
    throw new Error("Either 'ownerDocument' or 'format' must be set.")
  }
  let handler = new XDomHandler(elementFactory)
  let parser = new Parser(handler, parserOptions)
  parser.end(markup)
  return handler.dom
}

