import {
  ImagePackage, Component, Configurator,
  ParagraphPackage, HeadingPackage, StrongPackage, EmphasisPackage,
  ListPackage, LinkPackage, TablePackage, CodeblockPackage, FilePackage, InlineWrapperPackage,
} from 'substance'
import TestNode from './TestNode'
import TestBlockNode from './TestBlockNode'
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

const { InlineWrapper, InlineWrapperComponent } = InlineWrapperPackage

export default function getTestConfig() {
  let config = new Configurator()
  config.addToolGroup('default')
  config.addToolGroup('annotations')
  config.addToolGroup('overlay')
  config.addToolGroup('insert')
  config.defineSchema({
    name: 'test-article',
    ArticleClass: TestArticle,
    defaultTextType: 'paragraph',
    version: 1.0
  })

  config.import(ParagraphPackage)
  config.import(HeadingPackage)
  config.import(StrongPackage)
  config.import(EmphasisPackage)
  config.import(LinkPackage)
  config.import(ListPackage)
  config.import(TablePackage)
  config.import(CodeblockPackage)
  config.import(FilePackage)
  config.import(ImagePackage)

  config.addComponent('container', TestContainerComponent)

  config.addNode(TestNode)

  config.addNode(TestBlockNode)
  config.addComponent(TestBlockNode.type, Component)

  config.addNode(TestContainerAnnotation)

  config.addNode(TestInlineNode)
  config.addComponent(TestInlineNode.type, TestInlineNodeComponent)

  config.addNode(TestStructuredNode)
  config.addComponent(TestStructuredNode.type, TestStructuredNodeComponent)

  config.addNode(TestMetaNode)
  config.addConverter('xml', TestMetaNodeXMLConverter)

  config.addNode(InlineWrapper)
  config.addComponent(InlineWrapper.type, InlineWrapperComponent)


  config.addImporter('html', TestHTMLImporter)
  config.addImporter('xml', TestXMLImporter)
  config.addExporter('html', TestHTMLExporter)
  config.addExporter('xml', TestXMLExporter)

  return config
}