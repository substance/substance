import {
  Component, Configurator, BasePackage, TextNodeComponent
} from 'substance'

import TestBlockNode from './TestBlockNode'
import TestBody from './TestBody'
import TestContainerAnnotation from './TestContainerAnnotation'
import TestEmphasis from './TestEmphasis'
import TestHeading from './TestHeading'
import TestInlineNode from './TestInlineNode'
import TestLink from './TestLink'
import TestList from './TestList'
import TestListItem from './TestListItem'
import TestMetaNode from './TestMetaNode'
import TestNode from './TestNode'
import TestParagraph from './TestParagraph'
import TestPreformat from './TestPreformat'
import TestStrong from './TestStrong'
import TestStructuredNode from './TestStructuredNode'
import TestSubscript from './TestSubscript'
import TestSuperscript from './TestSuperscript'

import TestContainerComponent from './TestContainerComponent'
import TestEmphasisComponent from './TestEmphasisComponent'
import TestHeadingComponent from './TestHeadingComponent'
import TestInlineNodeComponent from './TestInlineNodeComponent'
import TestStrongComponent from './TestStrongComponent'
import TestStructuredNodeComponent from './TestStructuredNodeComponent'

import {
  EmphasisConverter, ParagraphConverter, ListItemConverter, ListConverter,
  LinkConverter, HeadingConverter, PreformatConverter, StrongConverter,
  SubscriptConverter, SuperscriptConverter
} from './TestHTMLConverters'
import TestMetaNodeXMLConverter from './TestMetaNodeXMLConverter'

import TestHTMLImporter from './TestHTMLImporter'
import TestHTMLExporter from './TestHTMLExporter'
import TestXMLImporter from './TestXMLImporter'
import TestXMLExporter from './TestXMLExporter'
import TestPlaintextExporter from '../TestPlaintextExporter'

export default function getTestConfig () {
  let config = new Configurator()

  config.import(BasePackage)

  config.addNode(TestBody)
  config.addNode(TestBlockNode)
  config.addNode(TestContainerAnnotation)
  config.addNode(TestEmphasis)
  config.addNode(TestHeading)
  config.addNode(TestInlineNode)
  config.addNode(TestLink)
  config.addNode(TestList)
  config.addNode(TestListItem)
  config.addNode(TestMetaNode)
  config.addNode(TestNode)
  config.addNode(TestParagraph)
  config.addNode(TestPreformat)
  config.addNode(TestStrong)
  config.addNode(TestStructuredNode)
  config.addNode(TestSubscript)
  config.addNode(TestSuperscript)

  config.addComponent('@container', TestContainerComponent)
  config.addComponent(TestBody.type, TestContainerComponent)
  config.addComponent(TestBlockNode.type, Component)
  config.addComponent(TestEmphasis.type, TestEmphasisComponent)
  config.addComponent(TestHeading.type, TestHeadingComponent)
  config.addComponent(TestInlineNode.type, TestInlineNodeComponent)
  config.addComponent(TestParagraph.type, TextNodeComponent)
  config.addComponent(TestStrong.type, TestStrongComponent)
  config.addComponent(TestStructuredNode.type, TestStructuredNodeComponent)

  config.addConverter('html', EmphasisConverter)
  config.addConverter('html', HeadingConverter)
  config.addConverter('html', LinkConverter)
  config.addConverter('html', ListConverter)
  config.addConverter('html', ListItemConverter)
  config.addConverter('html', ParagraphConverter)
  config.addConverter('html', PreformatConverter)
  config.addConverter('html', StrongConverter)
  config.addConverter('html', SubscriptConverter)
  config.addConverter('html', SuperscriptConverter)

  config.addConverter('xml', EmphasisConverter)
  config.addConverter('xml', HeadingConverter)
  config.addConverter('xml', LinkConverter)
  config.addConverter('xml', ListConverter)
  config.addConverter('xml', ListItemConverter)
  config.addConverter('xml', ParagraphConverter)
  config.addConverter('xml', PreformatConverter)
  config.addConverter('xml', StrongConverter)
  config.addConverter('xml', SubscriptConverter)
  config.addConverter('xml', SuperscriptConverter)
  config.addConverter('xml', TestMetaNodeXMLConverter)

  config.addImporter('html', TestHTMLImporter)
  config.addExporter('html', TestHTMLExporter)
  config.addImporter('xml', TestXMLImporter)
  config.addExporter('xml', TestXMLExporter)
  config.addExporter('text', TestPlaintextExporter)

  return config
}
