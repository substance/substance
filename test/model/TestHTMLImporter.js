import HTMLImporter from '../../model/HTMLImporter'
import schema from './TestSchema'
import TestArticle from './TestArticle'

import ParagraphHTMLConverter from '../../packages/paragraph/ParagraphHTMLConverter'
import HeadingHTMLConverter from '../../packages/heading/HeadingHTMLConverter'
import EmphasisHTMLConverter from '../../packages/emphasis/EmphasisHTMLConverter'
import StrongHTMLConverter from '../../packages/strong/StrongHTMLConverter'
import LinkHTMLConverter from '../../packages/link/LinkHTMLConverter'

var converters = [
  ParagraphHTMLConverter, HeadingHTMLConverter, EmphasisHTMLConverter,
  StrongHTMLConverter, LinkHTMLConverter
]

class TestHTMLImporter extends HTMLImporter {

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


TestHTMLImporter.converters = converters

export default TestHTMLImporter
