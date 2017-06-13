import { forEach, camelCase } from '../util'
import XMLTextNode from './XMLTextNode'
import XMLTextNodeConverter from './XMLTextNodeConverter'
import XMLElementNode from './XMLElementNode'
import XMLElementNodeConverter from './XMLElementNodeConverter'
import XMLAnnotationNode from './XMLAnnotationNode'
import XMLAnchorNode from './XMLAnchorNode'
import XMLInlineElementNode from './XMLInlineElementNode'
import XMLExternalNode from './XMLExternalNode'
import XMLExternalNodeConverter from './XMLExternalNodeConverter'
import XMLContainerNode from './XMLContainerNode'
import XMLNodeConverter from './XMLNodeConverter'

export default function registerSchema(config, xmlSchema, DocumentClass) {
  const schemaName = xmlSchema.getName()
  // schema declaration
  config.defineSchema({
    name: schemaName,
    version: xmlSchema.getVersion(),
    DocumentClass: DocumentClass,
    // TODO: defaultTextType is not a global thing,
    // rather a container specific property
    defaultTextType: 'p'
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
        NodeClass = XMLTextNode
        ConverterClass = XMLTextNodeConverter
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
  })
}

const BUILTIN_ATTRS = ['id', 'type', 'attributes', 'childNodes']

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
