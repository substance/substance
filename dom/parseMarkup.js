import { Parser } from './vendor'
import XDomHandler from './XDomHandler'

/*
  Parses HTML or XML

  Options:
  - format: 'html' or 'xml'
  - ownerDocument: an XNode instance of type 'document'
*/
export default function parseMarkup(markup, options) {
  let parserOptions = Object.assign({}, options)
  if (options.ownerDocument) {
    parserOptions.xmlMode = (options.ownerDocument.format === 'xml')
  } else if (options.format) {
    parserOptions.xmlMode = (options.format === 'xml')
    delete parserOptions.format
  } else {
    throw new Error("Either 'ownerDocument' or 'format' must be set.")
  }
  let handler = new XDomHandler()
  let parser = new Parser(handler, parserOptions)
  if (options.ownerDocument) {
    handler._doc = options.ownerDocument
  }
  parser.end(markup)
  return handler.dom
}

