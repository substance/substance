import HTMLImporter from '../../model/HTMLImporter'
import ParagraphHTMLConverter from '../../packages/paragraph/ParagraphHTMLConverter'
import HeadingHTMLConverter from '../../packages/heading/HeadingHTMLConverter'
import EmphasisHTMLConverter from '../../packages/emphasis/EmphasisHTMLConverter'
import StrongHTMLConverter from '../../packages/strong/StrongHTMLConverter'
import LinkHTMLConverter from '../../packages/link/LinkHTMLConverter'
import schema from './TestSchema'
import TestArticle from './TestArticle'

const CONVERTERS = [
  ParagraphHTMLConverter, HeadingHTMLConverter, EmphasisHTMLConverter,
  StrongHTMLConverter, LinkHTMLConverter
]

class TestHTMLImporter extends HTMLImporter {

  constructor() {
    super({
      schema: schema,
      converters: CONVERTERS,
      DocumentClass: TestArticle
    })
  }

  convertDocument(documentEl) {
    var bodyEl = documentEl.find('body')
    this.convertContainer(bodyEl.children, 'body')
  }

}


TestHTMLImporter.converters = CONVERTERS

export default TestHTMLImporter
