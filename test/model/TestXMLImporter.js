import XMLImporter from '../../model/XMLImporter'
import schema from './TestSchema'
import TestArticle from './TestArticle'

import ParagraphXMLConverter from '../../packages/paragraph/ParagraphXMLConverter'
import ImageXMLConverter from '../../packages/image/ImageXMLConverter'
import HeadingXMLConverter from '../../packages/heading/HeadingXMLConverter'
import EmphasisXMLConverter from '../../packages/emphasis/EmphasisXMLConverter'
import StrongXMLConverter from '../../packages/strong/StrongXMLConverter'
import LinkXMLConverter from '../../packages/link/LinkXMLConverter'
import TestMetaNodeXMLConverter from './TestMetaNodeXMLConverter'

var converters = [
  ParagraphXMLConverter, ImageXMLConverter, HeadingXMLConverter,
  EmphasisXMLConverter, StrongXMLConverter, LinkXMLConverter, TestMetaNodeXMLConverter
]

class TestXMLImporter extends XMLImporter {

  constructor() {
    super({
      schema: schema,
      converters: converters,
      DocumentClass: TestArticle
    })
  }

  convertDocument(documentEl) {
    var bodyEl = documentEl.find('body')
    this.convertContainer(bodyEl.children, 'body')
  }

}

TestXMLImporter.converters = converters

export default TestXMLImporter
