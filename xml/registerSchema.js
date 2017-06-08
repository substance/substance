import XMLTextNode from './XMLTextNode'
import XMLTextNodeConverter from './XMLTextNodeConverter'
import XMLElementNode from './XMLElementNode'
import XMLElementNodeConverter from './XMLElementNodeConverter'
import XMLAnnotationNode from './XMLAnnotationNode'
import XMLAnnotationNodeConverter from './XMLAnnotationNodeConverter'
import XMLAnchorNode from './XMLAnchorNode'
import XMLAnchorNodeConverter from './XMLAnchorNodeConverter'
import XMLInlineElementNode from './XMLInlineElementNode'
import XMLInlineElementNodeConverter from './XMLInlineElementNodeConverter'
import XMLExternalNode from './XMLExternalNode'
import XMLExternalNodeConverter from './XMLExternalNodeConverter'
import XMLContainerNode from './XMLContainerNode'
import XMLContainerNodeConverter from './XMLContainerNodeConverter'

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
    const element = xmlSchema.getElementSchema(tagName)
    let NodeClass, ConverterClass
    switch (element.type) {
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
        ConverterClass = XMLAnnotationNodeConverter
        break
      }
      case 'anchor': {
        NodeClass = XMLAnchorNode
        ConverterClass = XMLAnchorNodeConverter
        break
      }
      case 'inline-element': {
        NodeClass = XMLInlineElementNode
        ConverterClass = XMLInlineElementNodeConverter
        break
      }
      case 'external': {
        NodeClass = XMLExternalNode
        ConverterClass = XMLExternalNodeConverter
        break
      }
      case 'container': {
        NodeClass = XMLContainerNode
        ConverterClass = XMLContainerNodeConverter
        break
      }
      default:
        throw new Error('Illegal state')
    }
    // anonymous class definition
    class Node extends NodeClass {}
    Node.type = element.name
    config.addNode(Node)
    let converter = new ConverterClass(element.name)
    config.addConverter(schemaName, converter)
  })
}
