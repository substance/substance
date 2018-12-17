import {
  ImagePackage, Component, Configurator,
  BasePackage,
  ParagraphPackage, HeadingPackage, StrongPackage, EmphasisPackage,
  ListPackage, LinkPackage, TablePackage, CodeblockPackage,
  SubscriptPackage, SuperscriptPackage
  // InlineWrapperPackage,
} from 'substance'

import TestNode from './TestNode'
import TestBlockNode from './TestBlockNode'
import TestBody from './TestBody'
import TestContainerAnnotation from './TestContainerAnnotation'
import TestStructuredNode from './TestStructuredNode'
import TestStructuredNodeComponent from './TestStructuredNodeComponent'
import TestInlineNode from './TestInlineNode'
import TestInlineNodeComponent from './TestInlineNodeComponent'
import TestContainerComponent from './TestContainerComponent'
import TestMetaNode from './TestMetaNode'
import TestMetaNodeXMLConverter from './TestMetaNodeXMLConverter'
import TestHTMLImporter from './TestHTMLImporter'
import TestXMLImporter from './TestXMLImporter'
import TestHTMLExporter from './TestHTMLExporter'
import TestXMLExporter from './TestXMLExporter'
import TestArticle from './TestArticle'

// const { InlineWrapper, InlineWrapperComponent } = InlineWrapperPackage

export default function getTestConfig () {
  let config = new Configurator()
  // TODO: I want to move away from making name and version required
  // This is app specific and should be addressed somewhere else
  config.defineSchema({
    name: 'test-article',
    DocumentClass: TestArticle,
    defaultTextType: 'paragraph',
    version: 1.0
  })
  config.import(BasePackage)
  config.import(ParagraphPackage)
  config.import(HeadingPackage)
  config.import(StrongPackage)
  config.import(EmphasisPackage)
  config.import(SubscriptPackage)
  config.import(SuperscriptPackage)
  config.import(LinkPackage)
  config.import(ListPackage)
  config.import(TablePackage)
  config.import(CodeblockPackage)
  config.import(ImagePackage)

  config.addComponent('@container', TestContainerComponent)
  config.addComponent('body', TestContainerComponent)

  config.addNode(TestNode)
  config.addNode(TestBody)

  config.addNode(TestBlockNode)
  config.addComponent(TestBlockNode.type, Component)

  config.addNode(TestContainerAnnotation)

  config.addNode(TestInlineNode)
  config.addComponent(TestInlineNode.type, TestInlineNodeComponent)

  config.addNode(TestStructuredNode)
  config.addComponent(TestStructuredNode.type, TestStructuredNodeComponent)

  config.addNode(TestMetaNode)
  config.addConverter('xml', TestMetaNodeXMLConverter)

  // config.addNode(InlineWrapper)
  // config.addComponent(InlineWrapper.type, InlineWrapperComponent)

  config.addImporter('html', TestHTMLImporter)
  config.addImporter('xml', TestXMLImporter)
  config.addExporter('html', TestHTMLExporter)
  config.addExporter('xml', TestXMLExporter)

  return config
}
