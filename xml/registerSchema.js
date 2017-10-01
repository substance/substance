import { forEach, camelCase } from '../util'
import XMLTextElement from './XMLTextElement'
import XMLTextElementConverter from './XMLTextElementConverter'
import XMLElementNode from './XMLElementNode'
import XMLElementNodeConverter from './XMLElementNodeConverter'
import XMLAnnotationNode from './XMLAnnotationNode'
import XMLAnchorNode from './XMLAnchorNode'
import XMLInlineElementNode from './XMLInlineElementNode'
import XMLExternalNode from './XMLExternalNode'
import XMLExternalNodeConverter from './XMLExternalNodeConverter'
import XMLContainerNode from './XMLContainerNode'
import XMLNodeConverter from './XMLNodeConverter'
import XMLDocumentImporter from './XMLDocumentImporter'

export default function registerSchema(config, xmlSchema, DocumentClass, options = {}) {
  const schemaName = xmlSchema.getName()
  let defaultTextType
  // Some schemas don't require a defaultTextType, still we need to provide
  // it to the schema configuration if available
  if (xmlSchema.getDefaultTextType) {
    defaultTextType = xmlSchema.getDefaultTextType()
  }
  // schema declaration
  config.defineSchema({
    name: schemaName,
    version: xmlSchema.getVersion(),
    defaultTextType: defaultTextType,
    DocumentClass: DocumentClass,
    // HACK: storing the xmlSchema here so that we can use it later
    xmlSchema: xmlSchema
  })
  const tagNames = xmlSchema.getTagNames()
  // add node definitions and converters
  tagNames.forEach((tagName) => {
    const elementSchema = xmlSchema.getElementSchema(tagName)
    const name = elementSchema.name
    let NodeClass, ConverterClass
    switch (elementSchema.type) {
      case 'element':
      case 'hybrid': {
        NodeClass = XMLElementNode
        ConverterClass = XMLElementNodeConverter
        break
      }
      case 'text': {
        NodeClass = XMLTextElement
        ConverterClass = XMLTextElementConverter
        break
      }
      case 'annotation': {
        NodeClass = XMLAnnotationNode
        ConverterClass = XMLNodeConverter
        break
      }
      case 'anchor': {
        NodeClass = XMLAnchorNode
        ConverterClass = XMLNodeConverter
        break
      }
      case 'inline-element': {
        NodeClass = XMLInlineElementNode
        ConverterClass = XMLNodeConverter
        break
      }
      case 'external': {
        NodeClass = XMLExternalNode
        ConverterClass = XMLExternalNodeConverter
        break
      }
      case 'container': {
        NodeClass = XMLContainerNode
        ConverterClass = XMLElementNodeConverter
        break
      }
      default:
        throw new Error('Illegal state')
    }
    // anonymous class definition
    class Node extends NodeClass {}
    Node.type = name

    // defining property getters and setter for attributes
    const attributes = elementSchema.attributes
    forEach(attributes, (spec, name) => {
      _defineAttribute(Node, name, spec)
    })

    config.addNode(Node)
    let converter = new ConverterClass(name)
    config.addConverter(schemaName, converter)

    let ImporterClass = options.ImporterClass || XMLDocumentImporter
    config.addImporter(schemaName, ImporterClass)
  })
}

const BUILTIN_ATTRS = ['id', 'type', 'attributes', '_childNodes', '_content']

function _defineAttribute(Node, attributeName) {
  let name = attributeName.replace(':', '_')
  name = camelCase(name)
  if (BUILTIN_ATTRS.indexOf(name) >= 0) {
    // console.error(`attribute '${attributeName}' is internal and can not be overridden`)
    return
  }
  Object.defineProperty(Node.prototype, name, {
    get() {
      return this.getAttribute(attributeName)
    },
    set(val) {
      this.setAttribute(attributeName, val)
      return this
    }
  })
}
