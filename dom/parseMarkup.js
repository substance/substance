import { Parser } from './vendor'
import XDomHandler from './XDomHandler'

/*
  Parses HTML or XML

  Options:
  - format: 'html' or 'xml'
  - ownerDocument: an XNode instance of type 'document'
*/
export default function parseMarkup(markup, options) {
  let format = options.ownerDocument ? options.ownerDocument.format : options.format
  if (!format) {
    throw new Error("Either 'ownerDocument' or 'format' must be set.")
  }
  let parserOptions = {
    xmlMode : (format === 'xml')
  }
  let handler = new XDomHandler({ format })
  let parser = new Parser(handler, parserOptions)
  parser.end(markup)
  return handler.document
}

