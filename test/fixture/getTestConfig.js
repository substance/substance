import ParagraphPackage from '../../packages/paragraph/ParagraphPackage'
import HeadingPackage from '../../packages/heading/HeadingPackage'
import StrongPackage from '../../packages/strong/StrongPackage'
import EmphasisPackage from '../../packages/emphasis/EmphasisPackage'
import ListPackage from '../../packages/list/ListPackage'
import LinkPackage from '../../packages/link/LinkPackage'
import TablePackage from '../../packages/table/TablePackage'
import CodeblockPackage from '../../packages/codeblock/CodeblockPackage'
import FilePackage from '../../packages/file/FilePackage'
import ImagePackage from '../../packages/image/ImagePackage'
import Component from '../../ui/Component'
import Configurator from '../../util/Configurator'
import InlineWrapper from '../../packages/inline-wrapper/InlineWrapper'
import InlineWrapperComponent from '../../packages/inline-wrapper/InlineWrapperComponent'

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

export default function getTestConfig() {
  let config = new Configurator()
  config.addToolGroup('default')
  config.addToolGroup('annotations')
  config.addToolGroup('overlay')
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